const express = require('express');
const router = express.Router();
const axios = require('axios');

// Import models
const Passenger = require('../models/passenger');
const Driver = require('../models/driver');
const Ride = require('../models/ride');
const Report = require('../models/report');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Role check middleware
const isAdmin = (req, res, next) => {
  if (req.session.user.role !== 'admin') {
    req.session.error = 'Access denied. Administrators only.';
    return res.redirect('/');
  }
  next();
};

// Apply middleware to all routes
router.use(isAuthenticated, isAdmin);

// Admin dashboard
router.get('/', async (req, res) => {
  try {
    // Get real statistics from database
    const [passengerCount, driverCount, rideCount, completedRides, pendingRides] = await Promise.all([
      Passenger.countDocuments(),
      Driver.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'pending' })
    ]);

    const totalUsers = passengerCount + driverCount;
    
    // Get recent reports for revenue calculation
    const reports = await Report.find().sort({ reported_at: -1 }).limit(100);
    const totalRevenue = reports.reduce((sum, report) => sum + report.fare_amount, 0).toFixed(2);

    // Get recent activity (latest rides and user registrations)
    const recentRides = await Ride.find()
      .populate('passenger_id', 'name')
      .populate('driver_id', 'name')
      .sort({ requested_at: -1 })
      .limit(5);
      
    const recentPassengers = await Passenger.find()
      .sort({ joined_at: -1 })
      .limit(3);
      
    const recentDrivers = await Driver.find()
      .sort({ joined_at: -1 })
      .limit(3);
    
    // Format recent activity for display
    const recentActivity = [
      ...recentRides.map(ride => ({
        date: ride.requested_at ? new Date(ride.requested_at).toLocaleDateString() : 'N/A',
        user: ride.passenger_id ? ride.passenger_id.name : 'Unknown Passenger',
        action: 'Requested ride',
        details: `From ${ride.pickup_location} to ${ride.destination}`
      })),
      ...recentPassengers.map(passenger => ({
        date: passenger.joined_at ? new Date(passenger.joined_at).toLocaleDateString() : 'N/A',
        user: passenger.name,
        action: 'Registered as passenger',
        details: `Email: ${passenger.email}`
      })),
      ...recentDrivers.map(driver => ({
        date: driver.joined_at ? new Date(driver.joined_at).toLocaleDateString() : 'N/A',
        user: driver.name,
        action: 'Registered as driver',
        details: `Car: ${driver.carModel || 'N/A'}, Plate: ${driver.carPlateNumber || 'N/A'}`
      }))
    ];
    
    // Sort by date (newest first)
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const stats = {
      totalUsers,
      totalDrivers: driverCount,
      totalPassengers: passengerCount,
      totalRides: rideCount,
      completedRides,
      pendingRides,
      totalRevenue: `RM ${totalRevenue}`
    };
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats,
      recentActivity: recentActivity.slice(0, 10), // Show only 10 most recent activities
      layout: 'admin-layout'
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard data',
      error
    });
  }
});

// Manage users
router.get('/users', async (req, res) => {
  try {
    // Get real user data from database
    const [passengers, drivers] = await Promise.all([
      Passenger.find().sort({ joined_at: -1 }),
      Driver.find().sort({ joined_at: -1 })
    ]);

    // Format data for the view
    const users = [
      ...passengers.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        studentId: p.studentId || 'N/A',
        faculty: p.faculty || 'N/A',
        profilePicture: p.profilePicture || '/images/default-profile.png',
        role: 'passenger',
        status: 'active',
        joined: p.joined_at ? new Date(p.joined_at).toISOString().split('T')[0] : 'N/A'
      })),
      ...drivers.map(d => ({
        id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        studentId: d.studentId || 'N/A',
        faculty: d.faculty || 'N/A',
        carModel: d.carModel || 'N/A',
        carPlateNumber: d.carPlateNumber || 'N/A',
        license_number: d.license_number || 'N/A',
        profilePicture: d.profilePicture || '/images/default-profile.png',
        role: 'driver',
        status: d.status || 'active',
        joined: d.joined_at ? new Date(d.joined_at).toISOString().split('T')[0] : 'N/A'
      }))
    ];
    
    res.render('admin/users', {
      title: 'Manage Users',
      user: req.session.user,
      users,
      layout: 'admin-layout'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load user data',
      error
    });
  }
});

// Update user role
router.post('/users/:id/update-role', async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    
    if (newRole !== 'driver' && newRole !== 'passenger') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    // Check which collection the user is in
    let user = await Passenger.findById(id);
    let currentRole = 'passenger';
    
    if (!user) {
      user = await Driver.findById(id);
      currentRole = 'driver';
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }
    
    // If role change is needed
    if (currentRole !== newRole) {
      // Create user in new role collection
      if (newRole === 'driver') {
        const newDriver = new Driver({
          name: user.name,
          email: user.email,
          password: user.password,
          phone: user.phone,
          studentId: user.studentId,
          faculty: user.faculty,
          profilePicture: user.profilePicture
        });
        await newDriver.save();
        await Passenger.findByIdAndDelete(id);
      } else {
        const newPassenger = new Passenger({
          name: user.name,
          email: user.email,
          password: user.password,
          phone: user.phone,
          studentId: user.studentId,
          faculty: user.faculty,
          profilePicture: user.profilePicture
        });
        await newPassenger.save();
        await Driver.findByIdAndDelete(id);
      }
      
      return res.json({ success: true, message: `User role changed to ${newRole}` });
    }
    
    return res.json({ success: true, message: 'No role change needed' });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;
    const userData = req.body;
    
    let user;
    if (role === 'driver') {
      user = await Driver.findById(id);
    } else {
      user = await Passenger.findById(id);
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update common fields
    if (userData.name) user.name = userData.name;
    if (userData.email) user.email = userData.email;
    if (userData.phone !== undefined) user.phone = userData.phone;
    if (userData.studentId !== undefined) user.studentId = userData.studentId;
    if (userData.faculty !== undefined) user.faculty = userData.faculty;
    
    // Update driver-specific fields
    if (role === 'driver') {
      if (userData.carModel !== undefined) user.carModel = userData.carModel;
      if (userData.carPlateNumber !== undefined) user.carPlateNumber = userData.carPlateNumber;
      if (userData.license_number !== undefined) user.license_number = userData.license_number;
      if (userData.status) user.status = userData.status;
    }
    
    // Update timestamp
    user.updated_at = new Date();
    
    // Save changes to database
    await user.save();
    
    console.log(`User ${id} updated successfully`);
    return res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;
    
    let result;
    if (role === 'driver') {
      result = await Driver.findByIdAndDelete(id);
    } else {
      result = await Passenger.findByIdAndDelete(id);
    }
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log(`User ${id} deleted successfully`);
    return res.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedUser: {
        id: result._id,
        name: result.name,
        email: result.email
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get user details API endpoint
router.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;
    
    let user;
    if (role === 'driver') {
      user = await Driver.findById(id);
    } else {
      user = await Passenger.findById(id);
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Format user data
    const userData = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      studentId: user.studentId,
      faculty: user.faculty,
      profilePicture: user.profilePicture,
      joined_at: user.joined_at
    };
    
    // Add driver-specific fields
    if (role === 'driver') {
      userData.carModel = user.carModel;
      userData.carPlateNumber = user.carPlateNumber;
      userData.license_number = user.license_number;
      userData.status = user.status;
      userData.average_rating = user.average_rating;
      userData.rating_count = user.rating_count;
    }
    
    return res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manage rides
router.get('/rides', async (req, res) => {
  try {
    // Get rides with populated passenger and driver data
    const rides = await Ride.find()
      .populate('passenger_id', 'name email')
      .populate('driver_id', 'name email')
      .sort({ requested_at: -1 })
      .limit(100);
    
    // Format data for the view
    const formattedRides = rides.map(ride => ({
      id: ride._id,
      date: ride.date ? new Date(ride.date).toISOString().split('T')[0] : 'N/A',
      time: ride.date ? new Date(ride.date).toTimeString().split(' ')[0].substring(0, 5) : 'N/A',
      pickup: ride.pickup_location,
      destination: ride.destination,
      passenger: ride.passenger_id ? ride.passenger_id.name : 'Unknown',
      driver: ride.driver_id ? ride.driver_id.name : 'Pending',
      status: ride.status.charAt(0).toUpperCase() + ride.status.slice(1),
      fare: 'Varies'
    }));
    
    res.render('admin/rides', {
      title: 'Manage Rides',
      user: req.session.user,
      rides: formattedRides,
      layout: 'admin-layout'
    });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load ride data',
      error
    });
  }
});

// Reports dashboard
router.get('/reports', async (req, res) => {
  try {
    // Get reports with populated ride data
    const reports = await Report.find()
      .populate({
        path: 'ride_id',
        populate: [
          { path: 'passenger_id', select: 'name email' },
          { path: 'driver_id', select: 'name email' }
        ]
      })
      .sort({ reported_at: -1 })
      .limit(100);
    
    // Calculate statistics
    const totalReports = reports.length;
    const totalFare = reports.reduce((sum, report) => sum + report.fare_amount, 0).toFixed(2);
    const totalDistance = reports.reduce((sum, report) => sum + report.distance, 0).toFixed(2);
    const avgFare = totalReports > 0 ? (totalFare / totalReports).toFixed(2) : '0.00';
    
    // Count payment methods
    const paymentMethods = reports.reduce((acc, report) => {
      const method = report.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    
    // Format data for the view
    const formattedReports = reports.map(report => ({
      id: report._id,
      date: report.reported_at ? new Date(report.reported_at).toISOString().split('T')[0] : 'N/A',
      passenger: report.ride_id && report.ride_id.passenger_id ? report.ride_id.passenger_id.name : 'Unknown',
      driver: report.ride_id && report.ride_id.driver_id ? report.ride_id.driver_id.name : 'Unknown',
      distance: report.distance ? `${report.distance.toFixed(2)} km` : 'N/A',
      fare: `RM ${report.fare_amount.toFixed(2)}`,
      paymentMethod: report.payment_method || 'Unknown',
      status: report.payment_status || 'Pending'
    }));
    
    const stats = {
      totalReports,
      totalFare: `RM ${totalFare}`,
      totalDistance: `${totalDistance} km`,
      avgFare: `RM ${avgFare}`,
      paymentMethods
    };
    
    res.render('admin/reports', {
      title: 'Ride Reports',
      user: req.session.user,
      reports: formattedReports,
      stats,
      layout: 'admin-layout'
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load report data',
      error
    });
  }
});

// Get all users API
router.get('/api/users', async (req, res) => {
  try {
    console.log('API endpoint /admin/api/users called');
    // Get real user data from database
    const [passengers, drivers] = await Promise.all([
      Passenger.find().sort({ joined_at: -1 }),
      Driver.find().sort({ joined_at: -1 })
    ]);

    console.log(`Found ${passengers.length} passengers and ${drivers.length} drivers`);

    // Format data for the frontend
    const users = [
      ...passengers.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        studentId: p.studentId,
        faculty: p.faculty,
        profilePicture: p.profilePicture || '/images/default-profile.png',
        role: 'passenger',
        status: 'active',
        joined: p.joined_at ? new Date(p.joined_at).toISOString().split('T')[0] : 'N/A'
      })),
      ...drivers.map(d => ({
        id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        studentId: d.studentId,
        faculty: d.faculty,
        carModel: d.carModel,
        carPlateNumber: d.carPlateNumber,
        license_number: d.license_number,
        profilePicture: d.profilePicture || '/images/default-profile.png',
        role: 'driver',
        status: d.status || 'active',
        joined: d.joined_at ? new Date(d.joined_at).toISOString().split('T')[0] : 'N/A'
      }))
    ];
    
    console.log(`Returning ${users.length} formatted users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 
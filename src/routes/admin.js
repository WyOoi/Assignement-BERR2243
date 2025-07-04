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
      layout: true // Disable layout
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
        role: 'passenger',
        status: 'active',
        joined: p.joined_at ? new Date(p.joined_at).toISOString().split('T')[0] : 'N/A'
      })),
      ...drivers.map(d => ({
        id: d._id,
        name: d.name,
        email: d.email,
        role: 'driver',
        status: d.status || 'active',
        joined: d.joined_at ? new Date(d.joined_at).toISOString().split('T')[0] : 'N/A'
      }))
    ];
    
    res.render('admin/users', {
      title: 'Manage Users',
      user: req.session.user,
      users
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
    
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
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
      rides: formattedRides
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
    
    // Format data for the view
    const formattedReports = reports.map(report => ({
      id: report._id,
      rideId: report.ride_id._id,
      date: report.reported_at ? new Date(report.reported_at).toISOString().split('T')[0] : 'N/A',
      passenger: report.ride_id.passenger_id ? report.ride_id.passenger_id.name : 'Unknown',
      driver: report.ride_id.driver_id ? report.ride_id.driver_id.name : 'Unknown',
      distance: `${report.distance_km.toFixed(2)} km`,
      fare: `RM ${report.fare_amount.toFixed(2)}`,
      paymentMethod: report.payment_method.charAt(0).toUpperCase() + report.payment_method.slice(1),
      status: report.payment_status.charAt(0).toUpperCase() + report.payment_status.slice(1)
    }));
    
    // Calculate summary statistics
    const totalFare = reports.reduce((sum, report) => sum + report.fare_amount, 0).toFixed(2);
    const totalDistance = reports.reduce((sum, report) => sum + report.distance_km, 0).toFixed(2);
    const avgFare = reports.length > 0 ? (totalFare / reports.length).toFixed(2) : 0;
    
    const paymentMethods = reports.reduce((acc, report) => {
      acc[report.payment_method] = (acc[report.payment_method] || 0) + 1;
      return acc;
    }, {});
    
    res.render('admin/reports', {
      title: 'Ride Reports',
      user: req.session.user,
      reports: formattedReports,
      stats: {
        totalReports: reports.length,
        totalFare: `RM ${totalFare}`,
        totalDistance: `${totalDistance} km`,
        avgFare: `RM ${avgFare}`,
        paymentMethods
      }
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

// Get user by ID API
router.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const role = req.query.role || 'passenger';
    let user;
    
    if (role === 'driver') {
      user = await Driver.findById(userId);
    } else {
      user = await Passenger.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Remove sensitive information
    user = user.toObject();
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users API
router.get('/api/users', async (req, res) => {
  try {
    // Get real user data from database
    const [passengers, drivers] = await Promise.all([
      Passenger.find().sort({ joined_at: -1 }),
      Driver.find().sort({ joined_at: -1 })
    ]);

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
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 
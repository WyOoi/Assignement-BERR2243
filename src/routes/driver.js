const express = require('express');
const router = express.Router();
const axios = require('axios');
const Driver = require('../models/driver');
const Ride = require('../models/ride');
const Passenger = require('../models/passenger');
const Payment = require('../models/payment');
const Report = require('../models/report');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Role check middleware
const isDriver = (req, res, next) => {
  if (req.session.user.role !== 'driver') {
    req.session.error = 'Access denied. Drivers only.';
    return res.redirect('/');
  }
  next();
};

// Apply middleware to all routes
router.use(isAuthenticated, isDriver);

// Driver dashboard
router.get('/', async (req, res) => {
  console.log('Driver dashboard route accessed');
  console.log('Session user:', req.session.user);
  
  try {
    // Fetch pending ride requests that don't have a driver assigned
    const pendingRides = await Ride.find({ 
      status: 'pending',
      driver_id: null
    }).sort({ requested_at: -1 });
    
    // Get passenger details for each ride
    const rideRequests = [];
    
    for (const ride of pendingRides) {
      const passenger = await Passenger.findById(ride.passenger_id);
      const payment = await Payment.findOne({ ride_id: ride._id });
      
      if (passenger) {
        // Format date and time
        const rideDate = new Date(ride.date);
        const formattedDate = rideDate.toLocaleDateString('en-MY');
        const formattedTime = rideDate.toLocaleTimeString('en-MY', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
        
        rideRequests.push({
          id: ride._id,
          date: formattedDate,
          time: formattedTime,
          pickup: ride.pickup_location,
          destination: ride.destination,
          passenger: passenger.name,
          passengers: ride.passengers,
          status: ride.status,
          fare: payment ? `RM ${payment.amount.toFixed(2)}` : 'N/A',
          requested_at: ride.requested_at
        });
      }
    }
    
    // Get current active ride for this driver
    const currentRide = await Ride.findOne({
      driver_id: req.session.user.id,
      status: { $in: ['accepted', 'started', 'payment_pending'] }
    });
    
    let activeRide = null;
    
    if (currentRide) {
      const passenger = await Passenger.findById(currentRide.passenger_id);
      const payment = await Payment.findOne({ ride_id: currentRide._id });
      
      if (passenger) {
        const rideDate = new Date(currentRide.date);
        activeRide = {
          id: currentRide._id,
          date: rideDate.toLocaleDateString('en-MY'),
          time: rideDate.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          pickup: currentRide.pickup_location,
          destination: currentRide.destination,
          passenger: passenger.name,
          passengers: currentRide.passengers,
          status: currentRide.status,
          fare: payment ? `RM ${payment.amount.toFixed(2)}` : 'N/A',
          driver_confirmed_payment: currentRide.driver_confirmed_payment,
          passenger_confirmed_payment: currentRide.passenger_confirmed_payment
        };
      }
    }
    
    // Get recent completed rides (earnings)
    const completedRides = await Ride.find({
      driver_id: req.session.user.id,
      status: 'completed'
    }).sort({ completed_at: -1 }).limit(5);
    
    const recentEarnings = [];
    
    for (const ride of completedRides) {
      const passenger = await Passenger.findById(ride.passenger_id);
      const payment = await Payment.findOne({ ride_id: ride._id });
      
      if (passenger && payment) {
        const rideDate = new Date(ride.date);
        recentEarnings.push({
          id: ride._id,
          date: rideDate.toLocaleDateString('en-MY'),
          passenger: passenger.name,
          route: `${ride.pickup_location} → ${ride.destination}`,
          amount: `RM ${payment.amount.toFixed(2)}`
        });
      }
    }
    
    res.render('driver/dashboard', {
      title: 'Driver Dashboard',
      user: req.session.user,
      rideRequests,
      activeRide,
      recentEarnings
    });
  } catch (error) {
    console.error('Error fetching driver dashboard data:', error);
    res.render('driver/dashboard', {
      title: 'Driver Dashboard',
      user: req.session.user,
      error: 'Failed to load dashboard data',
      rideRequests: [],
      activeRide: null,
      recentEarnings: []
    });
  }
});

// View current rides
router.get('/current-rides', (req, res) => {
  // Mock current ride data
  const currentRides = [
    {
      id: '3',
      date: '2025-06-25',
      time: '14:00',
      pickup: 'UTeM Main Gate',
      destination: 'Melaka Sentral',
      passenger: 'Ahmad Ali',
      passengers: 3,
      status: 'In Progress'
    }
  ];
  
  res.render('driver/current-rides', {
    title: 'Current Rides',
    user: req.session.user,
    currentRides
  });
});

// View ride history
router.get('/history', (req, res) => {
  // Mock ride history data
  const rideHistory = [
    {
      id: '4',
      date: '2025-06-24',
      time: '09:30',
      pickup: 'UTeM Hostel',
      destination: 'Melaka Sentral',
      passenger: 'John Smith',
      passengers: 2,
      status: 'Completed',
      earnings: 'RM 20.00'
    },
    {
      id: '5',
      date: '2025-06-23',
      time: '17:15',
      pickup: 'UTeM Faculty of Engineering',
      destination: 'AEON Bandaraya',
      passenger: 'Lisa Chen',
      passengers: 1,
      status: 'Completed',
      earnings: 'RM 15.00'
    }
  ];
  
  res.render('driver/history', {
    title: 'Ride History',
    user: req.session.user,
    rideHistory
  });
});

// Accept a ride request
router.post('/accept-ride/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const driverId = req.session.user.id;
    
    console.log(`Driver ${driverId} accepting ride ${rideId}`);
    
    // Check if the ride is still available
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      req.session.error = 'Ride request not found';
      return res.redirect('/driver');
    }
    
    if (ride.status !== 'pending') {
      req.session.error = 'This ride is no longer available';
      return res.redirect('/driver');
    }
    
    if (ride.driver_id) {
      req.session.error = 'This ride has already been accepted by another driver';
      return res.redirect('/driver');
    }
    
    // Check if driver already has an active ride
    const activeRide = await Ride.findOne({
      driver_id: driverId,
      status: { $in: ['accepted', 'started', 'payment_pending'] }
    });
    
    if (activeRide) {
      req.session.error = 'You already have an active ride. Complete it before accepting a new one.';
      return res.redirect('/driver');
    }
    
    // Update the ride with driver information and change status
    ride.driver_id = driverId;
    ride.status = 'accepted';
    ride.accepted_at = new Date();
    
    await ride.save();
    
    console.log(`Ride ${rideId} accepted successfully by driver ${driverId}`);
    
    req.session.success = 'Ride request accepted successfully!';
    res.redirect('/driver');
  } catch (error) {
    console.error('Error accepting ride:', error);
    req.session.error = 'An error occurred while accepting the ride';
    res.redirect('/driver');
  }
});

// Start a ride
router.post('/start-ride/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const driverId = req.session.user.id;
    
    console.log(`Driver ${driverId} starting ride ${rideId}`);
    
    // Check if the ride exists and belongs to this driver
    const ride = await Ride.findOne({
      _id: rideId,
      driver_id: driverId,
      status: 'accepted'
    });
    
    if (!ride) {
      req.session.error = 'Ride not found or not in accepted status';
      return res.redirect('/driver');
    }
    
    // Update ride status
    ride.status = 'started';
    ride.started_at = new Date();
    
    await ride.save();
    
    console.log(`Ride ${rideId} started successfully by driver ${driverId}`);
    
    req.session.success = 'Ride started successfully!';
    res.redirect('/driver');
  } catch (error) {
    console.error('Error starting ride:', error);
    req.session.error = 'An error occurred while starting the ride';
    res.redirect('/driver');
  }
});

// Complete a ride
router.post('/complete-ride/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const driverId = req.session.user.id;
    
    console.log(`Driver ${driverId} completing ride ${rideId}`);
    
    // Check if the ride exists and belongs to this driver
    const ride = await Ride.findOne({
      _id: rideId,
      driver_id: driverId,
      status: 'started'
    });
    
    if (!ride) {
      req.session.error = 'Ride not found or not in started status';
      return res.redirect('/driver');
    }
    
    // Update ride status to payment_pending
    ride.status = 'payment_pending';
    ride.payment_initiated_at = new Date();
    
    await ride.save();
    
    // Update payment status to processing
    const payment = await Payment.findOne({ ride_id: rideId });
    if (payment) {
      payment.status = 'processing';
      await payment.save();
    }
    
    console.log(`Ride ${rideId} marked as payment pending by driver ${driverId}`);
    
    req.session.success = 'Ride completed! Waiting for payment confirmation.';
    res.redirect('/driver');
  } catch (error) {
    console.error('Error completing ride:', error);
    req.session.error = 'An error occurred while completing the ride';
    res.redirect('/driver');
  }
});

// Confirm payment as driver
router.post('/confirm-payment/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const driverId = req.session.user.id;
    
    console.log(`Driver ${driverId} confirming payment for ride ${rideId}`);
    
    // Check if the ride exists and belongs to this driver
    const ride = await Ride.findOne({
      _id: rideId,
      driver_id: driverId,
      status: 'payment_pending'
    });
    
    if (!ride) {
      req.session.error = 'Ride not found or not in payment pending status';
      return res.redirect('/driver');
    }
    
    // Mark driver confirmation
    ride.driver_confirmed_payment = true;
    
    // Get the payment record
    const payment = await Payment.findOne({ ride_id: rideId });
    
    // Update payment status to reflect driver confirmation
    if (payment && payment.status === 'processing') {
      payment.status = 'driver_confirmed';
      await payment.save();
      console.log(`Payment status updated to driver_confirmed for ride ${rideId}`);
    }
    
    // Check if both driver and passenger have confirmed
    if (ride.passenger_confirmed_payment) {
      // Complete the ride if both have confirmed
      ride.status = 'completed';
      ride.completed_at = new Date();
      
      // Update payment status to completed
      if (payment) {
        payment.status = 'completed';
        payment.paid_at = new Date();
        await payment.save();
        console.log(`Payment status updated to completed for ride ${rideId}`);
        
        // Calculate distance (mock for now, in a real app would be calculated from ride data)
        const distanceKm = parseFloat(payment.amount) / 3; // Simple mock calculation
        
        // Create a report entry
        const report = new Report({
          ride_id: rideId,
          distance_km: distanceKm,
          fare_amount: payment.amount,
          payment_method: payment.method,
          paid_at: payment.paid_at,
          payment_status: 'paid',
          reported_at: new Date()
        });
        
        await report.save();
        console.log(`Report created for ride ${rideId}`);
      }
      
      req.session.success = 'Payment confirmed and ride completed!';
    } else {
      req.session.success = 'Payment confirmed! Waiting for passenger confirmation.';
    }
    
    await ride.save();
    res.redirect('/driver');
  } catch (error) {
    console.error('Error confirming payment:', error);
    req.session.error = 'An error occurred while confirming payment';
    res.redirect('/driver');
  }
});

// View profile
router.get('/profile', async (req, res) => {
  try {
    // Get the latest user data from the database
    const driver = await Driver.findById(req.session.user.id);
    
    if (!driver) {
      req.session.error = 'User not found';
      return res.redirect('/driver');
    }
    
    // Merge session user with database user to ensure we have the latest data
    const user = {
      ...req.session.user,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      studentId: driver.studentId,
      faculty: driver.faculty,
      carModel: driver.carModel,
      licensePlate: driver.carPlateNumber,
      driverLicense: driver.license_number,
      status: driver.status,
      profilePicture: driver.profilePicture
    };
    
    // Update the session with the latest user data
    req.session.user = user;
    
    res.render('driver/profile', {
      title: 'My Profile',
      user: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    req.session.error = 'An error occurred while loading your profile';
    res.redirect('/driver');
  }
});

// Update profile
router.post('/profile', async (req, res) => {
  try {
    const { name, phone, studentId, faculty, carModel, licensePlate, driverLicense } = req.body;
    const userId = req.session.user.id;
    
    console.log('Updating profile for driver:', userId);
    console.log('New data:', { name, phone, studentId, faculty, carModel, licensePlate, driverLicense });
    
    // Update the user in the database
    const updatedDriver = await Driver.findByIdAndUpdate(
      userId,
      {
        name,
        phone,
        studentId,
        faculty,
        carModel,
        carPlateNumber: licensePlate,
        license_number: driverLicense,
        updated_at: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedDriver) {
      console.error('User not found in database');
      req.session.error = 'User not found';
      return res.redirect('/driver/profile');
    }
    
    console.log('Profile updated successfully:', updatedDriver);
    
    // Update session user data
    req.session.user = {
      ...req.session.user,
      name: updatedDriver.name,
      phone: updatedDriver.phone,
      studentId: updatedDriver.studentId,
      faculty: updatedDriver.faculty,
      carModel: updatedDriver.carModel,
      licensePlate: updatedDriver.carPlateNumber,
      driverLicense: updatedDriver.license_number
    };
    
    req.session.success = 'Profile updated successfully!';
    res.redirect('/driver/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.session.error = 'An error occurred while updating your profile';
    res.redirect('/driver/profile');
  }
});

// Change password
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;
  
  // In a real app, you would verify the current password against a database
  // and then update with the new hashed password
  
  req.session.success = 'Password changed successfully!';
  res.redirect('/driver/profile');
});

// Delete account
router.post('/delete-account', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { confirmEmail } = req.body;
    
    console.log('Delete account request received');
    console.log('User ID:', userId);
    console.log('Session user:', req.session.user);
    console.log('Request body:', req.body);
    console.log('Confirm email:', confirmEmail);
    
    // Verify email matches before proceeding
    if (!confirmEmail) {
      console.error('Email confirmation missing');
      req.session.error = 'Email confirmation is required. Account not deleted.';
      return res.redirect('/driver/profile');
    }
    
    if (confirmEmail !== req.session.user.email) {
      console.error('Email confirmation failed');
      console.error(`Expected: ${req.session.user.email}, Got: ${confirmEmail}`);
      req.session.error = 'Email confirmation failed. Account not deleted.';
      return res.redirect('/driver/profile');
    }
    
    // Delete the user from the database
    const deletedDriver = await Driver.findByIdAndDelete(userId);
    
    if (!deletedDriver) {
      console.error('User not found in database');
      req.session.error = 'User not found. Account not deleted.';
      return res.redirect('/driver/profile');
    }
    
    console.log('Driver account deleted successfully:', deletedDriver);
    
    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/?message=Your account has been deleted successfully');
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    console.error(error.stack);
    req.session.error = 'An error occurred while deleting your account';
    res.redirect('/driver/profile');
  }
});

// Set availability status
router.post('/availability', (req, res) => {
  const { status } = req.body;
  
  // Update session user data
  req.session.user = {
    ...req.session.user,
    available: status === 'available'
  };
  
  req.session.success = 'Availability status updated!';
  res.redirect('/driver');
});

module.exports = router; 
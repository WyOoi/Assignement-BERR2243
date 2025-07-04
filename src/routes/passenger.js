const express = require('express');
const router = express.Router();
const axios = require('axios');
const Passenger = require('../models/passenger');
const Ride = require('../models/ride');
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
const isPassenger = (req, res, next) => {
  if (req.session.user.role !== 'passenger') {
    req.session.error = 'Access denied. Passengers only.';
    return res.redirect('/');
  }
  next();
};

// Apply middleware to all routes
router.use(isAuthenticated, isPassenger);

// Passenger dashboard
router.get('/', async (req, res) => {
  try {
    // Get recent rides for this passenger
    const recentRides = await Ride.find({ passenger_id: req.session.user.id })
      .sort({ requested_at: -1 })
      .limit(5);
    
    // Get payment information for these rides
    const rideIds = recentRides.map(ride => ride._id);
    const payments = await Payment.find({ ride_id: { $in: rideIds } });
    
    // Attach payment info to each ride
    const ridesWithPayments = recentRides.map(ride => {
      const rideObj = ride.toObject();
      rideObj.payment = payments.find(p => p.ride_id.toString() === ride._id.toString());
      return rideObj;
    });
    
    res.render('passenger/dashboard', {
      title: 'Passenger Dashboard',
      user: req.session.user,
      recentRides: ridesWithPayments
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.render('passenger/dashboard', {
      title: 'Passenger Dashboard',
      user: req.session.user,
      error: 'Failed to load recent rides'
    });
  }
});

// View ride history
router.get('/rides', async (req, res) => {
  try {
    // Get all rides for this passenger
    const rides = await Ride.find({ passenger_id: req.session.user.id })
      .sort({ requested_at: -1 });
    
    // Get payment information for these rides
    const rideIds = rides.map(ride => ride._id);
    const payments = await Payment.find({ ride_id: { $in: rideIds } });
    
    // Attach payment info to each ride
    const ridesWithPayments = rides.map(ride => {
      const rideObj = ride.toObject();
      rideObj.payment = payments.find(p => p.ride_id.toString() === ride._id.toString());
      return rideObj;
    });
    
    res.render('passenger/rides', {
      title: 'My Rides',
      user: req.session.user,
      rides: ridesWithPayments
    });
  } catch (error) {
    console.error('Error fetching ride history:', error);
    req.session.error = 'Failed to load ride history';
    res.redirect('/passenger');
  }
});

// Request a new ride page
router.get('/request', (req, res) => {
  res.render('passenger/request', {
    title: 'Request a Ride',
    user: req.session.user
  });
});

// Submit ride request
router.post('/request', async (req, res) => {
  try {
    const { 
      pickup, destination, date, time, 
      passengers, paymentMethod, notes
    } = req.body;
    
    // Calculate fare based on form data
    const distanceValue = parseFloat(req.body.distanceValue || 0);
    const estimatedTime = parseInt(req.body.estimatedTime || 0);
    
    // Parse the fare value and ensure it's a valid number
    let totalFare = parseFloat(req.body.totalFare || 0);
    
    // Recalculate fare if it's 0 or invalid
    if (isNaN(totalFare) || totalFare <= 0) {
      const baseFare = 5.00;
      const distanceFare = distanceValue * 1.50; // RM 1.50 per km
      const timeFare = estimatedTime * 0.20; // RM 0.20 per minute
      const platformFee = 2.00;
      totalFare = baseFare + distanceFare + timeFare + platformFee;
    }
    
    console.log('Fare information:', {
      distanceValue,
      estimatedTime,
      totalFare,
      rawFareFromForm: req.body.totalFare
    });
    
    // Combine date and time into a single Date object
    const dateTime = new Date(`${date}T${time}`);
    
    // Create new ride document
    const newRide = new Ride({
      passenger_id: req.session.user.id,
      pickup_location: pickup,
      destination: destination,
      date: dateTime,
      passengers: parseInt(passengers),
      notes: notes || '',
      status: 'pending',
      requested_at: new Date()
    });
    
    // Save ride to database
    await newRide.save();
    
    // Create payment record
    // Ensure the amount is a valid positive number
    const paymentAmount = Math.max(totalFare, 0.01); // Minimum 0.01 to ensure it's not 0
    
    const payment = new Payment({
      ride_id: newRide._id,
      amount: paymentAmount,
      method: paymentMethod,
      status: 'pending'
    });
    
    console.log('Creating payment record with amount:', paymentAmount);
    
    // Save payment to database
    await payment.save();
    
    console.log('New ride request saved:', newRide._id);
    console.log('Payment record created:', payment._id);
    
    req.session.success = 'Ride request submitted successfully!';
    res.redirect('/passenger');
  } catch (error) {
    console.error('Error submitting ride request:', error);
    req.session.error = 'An error occurred while submitting your ride request';
    res.redirect('/passenger/request');
  }
});

// View profile
router.get('/profile', async (req, res) => {
  try {
    // Get the latest user data from the database
    const passenger = await Passenger.findById(req.session.user.id);
    
    if (!passenger) {
      req.session.error = 'User not found';
      return res.redirect('/passenger');
    }
    
    // Merge session user with database user to ensure we have the latest data
    const user = {
      ...req.session.user,
      name: passenger.name,
      email: passenger.email,
      phone: passenger.phone,
      studentId: passenger.studentId,
      faculty: passenger.faculty,
      profilePicture: passenger.profilePicture
    };
    
    // Update the session with the latest user data
    req.session.user = user;
    
    res.render('passenger/profile', {
      title: 'My Profile',
      user: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    req.session.error = 'An error occurred while loading your profile';
    res.redirect('/passenger');
  }
});

// Update profile
router.post('/profile', async (req, res) => {
  try {
    const { name, phone, studentId, faculty } = req.body;
    const userId = req.session.user.id;
    
    console.log('Updating profile for user:', userId);
    console.log('New data:', { name, phone, studentId, faculty });
    
    // Update the user in the database
    const updatedPassenger = await Passenger.findByIdAndUpdate(
      userId,
      {
        name,
        phone,
        studentId,
        faculty,
        updated_at: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedPassenger) {
      console.error('User not found in database');
      req.session.error = 'User not found';
      return res.redirect('/passenger/profile');
    }
    
    console.log('Profile updated successfully:', updatedPassenger);
    
    // Update session user data
    req.session.user = {
      ...req.session.user,
      name: updatedPassenger.name,
      phone: updatedPassenger.phone,
      studentId: updatedPassenger.studentId,
      faculty: updatedPassenger.faculty
    };
    
    req.session.success = 'Profile updated successfully!';
    res.redirect('/passenger/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.session.error = 'An error occurred while updating your profile';
    res.redirect('/passenger/profile');
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;
    
    // Find the user in the database
    const passenger = await Passenger.findById(userId);
    
    if (!passenger) {
      req.session.error = 'User not found';
      return res.redirect('/passenger/profile');
    }
    
    // Verify current password
    const isPasswordValid = await passenger.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      req.session.error = 'Current password is incorrect';
      return res.redirect('/passenger/profile');
    }
    
    // Update password
    passenger.password = newPassword; // In production, this would be hashed
    passenger.updated_at = new Date();
    await passenger.save();
    
    req.session.success = 'Password changed successfully!';
    res.redirect('/passenger/profile');
  } catch (error) {
    console.error('Error changing password:', error);
    req.session.error = 'An error occurred while changing your password';
    res.redirect('/passenger/profile');
  }
});

// Delete account
router.post('/delete-account', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userEmail = req.session.user.email;
    const confirmEmail = req.body.confirmEmail;
    
    console.log('Delete account request received for user:', userId);
    console.log('User email:', userEmail);
    console.log('Confirmation email:', confirmEmail);
    
    // Check if confirmation email is provided
    if (!confirmEmail) {
      console.error('Email confirmation missing');
      req.session.error = 'Email confirmation is required. Account not deleted.';
      return res.redirect('/passenger/profile');
    }
    
    // Verify email confirmation matches user email
    if (confirmEmail !== userEmail) {
      console.error('Email confirmation failed');
      console.error(`Expected: ${userEmail}, Got: ${confirmEmail}`);
      req.session.error = 'Email confirmation failed. Please enter your correct email address.';
      return res.redirect('/passenger/profile');
    }
    
    // Delete the user from the database
    console.log('Attempting to delete user from database...');
    const result = await Passenger.findByIdAndDelete(userId);
    
    if (!result) {
      console.error('User not found in database');
      req.session.error = 'User not found';
      return res.redirect('/passenger/profile');
    }
    
    console.log('User deleted successfully:', result._id);
    
    // Destroy the session and redirect to home page
    req.session.destroy(() => {
      res.redirect('/?message=Your account has been deleted successfully');
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    req.session.error = 'An error occurred while deleting your account';
    res.redirect('/passenger/profile');
  }
});

// View ride details
router.get('/rides/:id', async (req, res) => {
  try {
    // Get ride details
    const ride = await Ride.findOne({ 
      _id: req.params.id,
      passenger_id: req.session.user.id
    });
    
    if (!ride) {
      req.session.error = 'Ride not found';
      return res.redirect('/passenger/rides');
    }
    
    // Get payment information
    const payment = await Payment.findOne({ ride_id: ride._id });
    
    // Convert ride to object and attach payment
    const rideWithPayment = ride.toObject();
    rideWithPayment.payment = payment;
    
    res.render('passenger/ride-details', {
      title: 'Ride Details',
      user: req.session.user,
      ride: rideWithPayment
    });
  } catch (error) {
    console.error('Error fetching ride details:', error);
    req.session.error = 'Failed to load ride details';
    res.redirect('/passenger/rides');
  }
});

// Cancel ride
router.post('/rides/:id/cancel', async (req, res) => {
  try {
    // Find the ride and check if it belongs to this passenger
    const ride = await Ride.findOne({ 
      _id: req.params.id,
      passenger_id: req.session.user.id,
      status: 'pending' // Can only cancel pending rides
    });
    
    if (!ride) {
      req.session.error = 'Ride not found or cannot be cancelled';
      return res.redirect('/passenger/rides');
    }
    
    // Update ride status to cancelled
    ride.status = 'cancelled';
    await ride.save();
    
    req.session.success = 'Ride cancelled successfully';
    res.redirect('/passenger/rides');
  } catch (error) {
    console.error('Error cancelling ride:', error);
    req.session.error = 'Failed to cancel ride';
    res.redirect('/passenger/rides');
  }
});

// Confirm payment as passenger
router.post('/confirm-payment/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const passengerId = req.session.user.id;
    
    console.log(`Passenger ${passengerId} confirming payment for ride ${rideId}`);
    
    // Check if the ride exists and belongs to this passenger
    const ride = await Ride.findOne({
      _id: rideId,
      passenger_id: passengerId,
      status: 'payment_pending'
    });
    
    if (!ride) {
      req.session.error = 'Ride not found or not in payment pending status';
      return res.redirect('/passenger/rides');
    }
    
    // Mark passenger confirmation
    ride.passenger_confirmed_payment = true;
    
    // Get the payment record
    const payment = await Payment.findOne({ ride_id: rideId });
    
    // Update payment status to reflect passenger confirmation
    if (payment) {
      if (payment.status === 'processing') {
        payment.status = 'passenger_confirmed';
      } else if (payment.status === 'driver_confirmed') {
        payment.status = 'completed';
        payment.paid_at = new Date();
      }
      await payment.save();
      console.log(`Payment status updated to ${payment.status} for ride ${rideId}`);
    }
    
    // Check if both driver and passenger have confirmed
    if (ride.driver_confirmed_payment) {
      // Complete the ride if both have confirmed
      ride.status = 'completed';
      ride.completed_at = new Date();
      
      // Update payment status
      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.paid_at = new Date();
        await payment.save();
        console.log(`Payment status updated to completed for ride ${rideId}`);
      }
      
      // Create a report entry if it doesn't exist yet
      const existingReport = await Report.findOne({ ride_id: rideId });
      
      if (!existingReport && payment) {
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
      req.session.success = 'Payment confirmed! Waiting for driver confirmation.';
    }
    
    await ride.save();
    res.redirect('/passenger/rides');
  } catch (error) {
    console.error('Error confirming payment:', error);
    req.session.error = 'An error occurred while confirming payment';
    res.redirect('/passenger/rides');
  }
});

module.exports = router; 
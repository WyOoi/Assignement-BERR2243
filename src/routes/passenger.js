const express = require('express');
const router = express.Router();
const axios = require('axios');
const Passenger = require('../models/passenger');

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
router.get('/', (req, res) => {
  res.render('passenger/dashboard', {
    title: 'Passenger Dashboard',
    user: req.session.user
  });
});

// View ride history
router.get('/rides', (req, res) => {
  // Mock ride history data
  const rides = [
    {
      id: '1',
      date: '2025-06-24',
      time: '14:30',
      pickup: 'UTeM Main Campus',
      destination: 'MITC Mall',
      driver: 'John Doe',
      status: 'Completed',
      fare: 'RM 15.00'
    },
    {
      id: '2',
      date: '2025-06-22',
      time: '09:15',
      pickup: 'UTeM Hostel',
      destination: 'Melaka Sentral',
      driver: 'Jane Smith',
      status: 'Completed',
      fare: 'RM 25.00'
    }
  ];
  
  res.render('passenger/rides', {
    title: 'My Rides',
    user: req.session.user,
    rides
  });
});

// Request a new ride page
router.get('/request', (req, res) => {
  res.render('passenger/request', {
    title: 'Request a Ride',
    user: req.session.user
  });
});

// Submit ride request
router.post('/request', (req, res) => {
  const { pickup, destination, date, time, passengers } = req.body;
  
  // This would normally make an API call to your backend
  // const response = await axios.post('http://your-backend-api/rides/request', { 
  //   userId: req.session.user.id,
  //   pickup,
  //   destination,
  //   date,
  //   time,
  //   passengers
  // });
  
  // For demo purposes, we'll simulate a successful request
  req.session.success = 'Ride request submitted successfully!';
  res.redirect('/passenger');
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

module.exports = router; 
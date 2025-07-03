const express = require('express');
const router = express.Router();
const axios = require('axios');
const Driver = require('../models/driver');

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
router.get('/', (req, res) => {
  console.log('Driver dashboard route accessed');
  console.log('Session user:', req.session.user);
  
  // Mock available ride requests
  const rideRequests = [
    {
      id: '1',
      date: '2025-06-25',
      time: '15:00',
      pickup: 'UTeM Faculty of ICT',
      destination: 'Dataran Pahlawan',
      passenger: 'Sarah Lee',
      passengers: 2,
      status: 'Pending'
    },
    {
      id: '2',
      date: '2025-06-25',
      time: '16:30',
      pickup: 'UTeM Library',
      destination: 'Mahkota Parade',
      passenger: 'Mike Wong',
      passengers: 1,
      status: 'Pending'
    }
  ];
  
  res.render('driver/dashboard', {
    title: 'Driver Dashboard',
    user: req.session.user,
    rideRequests
  });
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
router.post('/accept-ride/:id', (req, res) => {
  const rideId = req.params.id;
  
  // This would normally make an API call to your backend
  // const response = await axios.post(`http://your-backend-api/rides/${rideId}/accept`, { 
  //   driverId: req.session.user.id
  // });
  
  // For demo purposes, we'll simulate a successful acceptance
  req.session.success = 'Ride request accepted successfully!';
  res.redirect('/driver/current-rides');
});

// Complete a ride
router.post('/complete-ride/:id', (req, res) => {
  const rideId = req.params.id;
  
  // This would normally make an API call to your backend
  // const response = await axios.post(`http://your-backend-api/rides/${rideId}/complete`, { 
  //   driverId: req.session.user.id
  // });
  
  // For demo purposes, we'll simulate a successful completion
  req.session.success = 'Ride completed successfully!';
  res.redirect('/driver/history');
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
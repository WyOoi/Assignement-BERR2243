const express = require('express');
const router = express.Router();
const axios = require('axios');

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
router.get('/profile', (req, res) => {
  res.render('passenger/profile', {
    title: 'My Profile',
    user: req.session.user
  });
});

// Update profile
router.post('/profile', (req, res) => {
  const { name, email, phone } = req.body;
  
  // Update session user data
  req.session.user = {
    ...req.session.user,
    name,
    email,
    phone
  };
  
  req.session.success = 'Profile updated successfully!';
  res.redirect('/passenger/profile');
});

module.exports = router; 
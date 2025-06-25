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
router.get('/profile', (req, res) => {
  res.render('driver/profile', {
    title: 'My Profile',
    user: req.session.user
  });
});

// Update profile
router.post('/profile', (req, res) => {
  const { name, email, phone, carModel, licensePlate } = req.body;
  
  // Update session user data
  req.session.user = {
    ...req.session.user,
    name,
    email,
    phone,
    carModel,
    licensePlate
  };
  
  req.session.success = 'Profile updated successfully!';
  res.redirect('/driver/profile');
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
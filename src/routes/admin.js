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
router.get('/', (req, res) => {
  // Mock statistics
  const stats = {
    totalUsers: 120,
    totalDrivers: 25,
    totalPassengers: 95,
    activeRides: 8,
    completedRides: 450,
    totalRevenue: 'RM 6,750.00'
  };
  
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    user: req.session.user,
    stats
  });
});

// Manage users
router.get('/users', (req, res) => {
  // Mock user data
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@utem.edu.my',
      role: 'passenger',
      status: 'active',
      joined: '2025-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@utem.edu.my',
      role: 'driver',
      status: 'active',
      joined: '2025-02-20'
    },
    {
      id: '3',
      name: 'Admin User',
      email: 'admin@utem.edu.my',
      role: 'admin',
      status: 'active',
      joined: '2024-12-01'
    }
  ];
  
  res.render('admin/users', {
    title: 'Manage Users',
    user: req.session.user,
    users
  });
});

// View user details
router.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  
  // Mock user details
  const userDetail = {
    id: userId,
    name: 'John Doe',
    email: 'john@utem.edu.my',
    phone: '012-3456789',
    role: 'passenger',
    status: 'active',
    joined: '2025-01-15',
    rides: 15,
    totalSpent: 'RM 225.00'
  };
  
  res.render('admin/user-detail', {
    title: 'User Details',
    user: req.session.user,
    userDetail
  });
});

// Manage rides
router.get('/rides', (req, res) => {
  // Mock ride data
  const rides = [
    {
      id: '1',
      date: '2025-06-24',
      time: '14:30',
      pickup: 'UTeM Main Campus',
      destination: 'MITC Mall',
      passenger: 'Sarah Lee',
      driver: 'John Doe',
      status: 'Completed',
      fare: 'RM 15.00'
    },
    {
      id: '2',
      date: '2025-06-25',
      time: '09:15',
      pickup: 'UTeM Hostel',
      destination: 'Melaka Sentral',
      passenger: 'Mike Wong',
      driver: 'Jane Smith',
      status: 'In Progress',
      fare: 'RM 25.00'
    },
    {
      id: '3',
      date: '2025-06-25',
      time: '16:30',
      pickup: 'UTeM Library',
      destination: 'Dataran Pahlawan',
      passenger: 'Ahmad Ali',
      driver: 'Pending',
      status: 'Pending',
      fare: 'RM 20.00 (est.)'
    }
  ];
  
  res.render('admin/rides', {
    title: 'Manage Rides',
    user: req.session.user,
    rides
  });
});

// View ride details
router.get('/rides/:id', (req, res) => {
  const rideId = req.params.id;
  
  // Mock ride details
  const rideDetail = {
    id: rideId,
    date: '2025-06-24',
    time: '14:30',
    pickup: 'UTeM Main Campus',
    destination: 'MITC Mall',
    distance: '5.2 km',
    duration: '15 minutes',
    passenger: {
      id: '1',
      name: 'Sarah Lee',
      email: 'sarah@utem.edu.my',
      phone: '012-3456789'
    },
    driver: {
      id: '2',
      name: 'John Doe',
      email: 'john.driver@utem.edu.my',
      phone: '012-9876543',
      carModel: 'Perodua Myvi',
      licensePlate: 'ABC 1234'
    },
    status: 'Completed',
    fare: 'RM 15.00',
    paymentMethod: 'Cash'
  };
  
  res.render('admin/ride-detail', {
    title: 'Ride Details',
    user: req.session.user,
    rideDetail
  });
});

// System settings
router.get('/settings', (req, res) => {
  // Mock settings
  const settings = {
    baseFare: 5.00,
    perKmRate: 1.50,
    perMinuteRate: 0.20,
    platformFee: 2.00,
    maxDistance: 30
  };
  
  res.render('admin/settings', {
    title: 'System Settings',
    user: req.session.user,
    settings
  });
});

// Update settings
router.post('/settings', (req, res) => {
  const { baseFare, perKmRate, perMinuteRate, platformFee, maxDistance } = req.body;
  
  // This would normally make an API call to your backend
  // const response = await axios.post('http://your-backend-api/admin/settings', { 
  //   baseFare, perKmRate, perMinuteRate, platformFee, maxDistance
  // });
  
  req.session.success = 'Settings updated successfully!';
  res.redirect('/admin/settings');
});

module.exports = router; 
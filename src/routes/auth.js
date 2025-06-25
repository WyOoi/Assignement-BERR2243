const express = require('express');
const router = express.Router();
const axios = require('axios');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', { 
    title: 'Login to MyTaxi',
    error: null
  });
});

// Login form submission
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // This would normally make an API call to your backend
    // const response = await axios.post('http://your-backend-api/auth/login', { email, password });
    
    // For demo purposes, we'll simulate a successful login
    const mockUser = {
      id: '1',
      name: email.split('@')[0],
      email,
      role: email.includes('driver') ? 'driver' : 
            email.includes('admin') ? 'admin' : 'passenger'
    };
    
    req.session.user = mockUser;
    
    // Redirect based on user role
    if (mockUser.role === 'admin') {
      return res.redirect('/admin');
    } else if (mockUser.role === 'driver') {
      return res.redirect('/driver');
    } else {
      return res.redirect('/passenger');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login to MyTaxi',
      error: 'Invalid email or password'
    });
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', { 
    title: 'Register for MyTaxi',
    error: null
  });
});

// Register form submission
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // This would normally make an API call to your backend
    // const response = await axios.post('http://your-backend-api/auth/register', { name, email, password, role });
    
    // For demo purposes, we'll simulate a successful registration
    const mockUser = {
      id: '1',
      name,
      email,
      role: role || 'passenger'
    };
    
    req.session.user = mockUser;
    
    // Redirect based on user role
    if (mockUser.role === 'admin') {
      return res.redirect('/admin');
    } else if (mockUser.role === 'driver') {
      return res.redirect('/driver');
    } else {
      return res.redirect('/passenger');
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register for MyTaxi',
      error: 'Registration failed. Please try again.'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router; 
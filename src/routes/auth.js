const express = require('express');
const router = express.Router();
const axios = require('axios');

// In-memory user store (prototype only – replace with real DB in production)
const users = [
  // Pre-seed a few demo accounts so the test buttons on the login page keep working
  { id: '1', name: 'Demo Passenger', email: 'passenger@utem.edu.my', password: 'test', role: 'passenger' },
  { id: '2', name: 'Demo Driver',    email: 'driver@utem.edu.my',    password: 'test', role: 'driver'    },
  { id: '3', name: 'Demo Admin',     email: 'admin@utem.edu.my',     password: 'test', role: 'admin'     }
];

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
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user in the in-memory store
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.render('auth/login', {
      title: 'Login to MyTaxi',
      error: 'Invalid email or password'
    });
  }

  // Store user in session (omit password)
  const { password: _pw, ...safeUser } = user;
  req.session.user = safeUser;

  // Redirect based on role
  if (user.role === 'admin') {
    return res.redirect('/admin');
  }
  if (user.role === 'driver') {
    return res.redirect('/driver');
  }
  return res.redirect('/passenger');
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
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  // Basic duplicate-email check
  if (users.some(u => u.email === email)) {
    return res.render('auth/register', {
      title: 'Register for MyTaxi',
      error: 'An account with that email already exists. Please log in instead.'
    });
  }

  const newUser = {
    id: String(users.length + 1),
    name,
    email,
    password, // Do NOT store plaintext passwords in production!
    role: role || 'passenger'
  };

  users.push(newUser);

  // Auto-login after successful registration
  const { password: _pw, ...safeUser } = newUser;
  req.session.user = safeUser;

  // Redirect based on role
  if (newUser.role === 'driver') {
    return res.redirect('/driver');
  }
  if (newUser.role === 'admin') {
    return res.redirect('/admin');
  }
  return res.redirect('/passenger');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// API Endpoints for User Management
// These would typically be in a separate API routes file in a real application

// Get user by ID
router.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Don't send password in response
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Delete user by ID
router.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Remove user from array
  users.splice(userIndex, 1);
  
  // In a real app, you would also delete related data
  
  // If the user being deleted is the current user, destroy the session
  if (req.session.user && req.session.user.id === userId) {
    req.session.destroy();
  }
  
  res.json({ message: 'User deleted successfully' });
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');

// Import models
const Passenger = require('../models/passenger');
const Driver = require('../models/driver');
const Admin = require('../models/admin');

// In-memory admin user for demo (will be moved to MongoDB later)
const adminUsers = [
  { id: '3', name: 'Demo Admin', email: 'admin@utem.edu.my', password: 'test', role: 'admin' }
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
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role, password: '***' });
    console.log('Request body:', req.body);
    
    let user = null;
    let userRole = role || 'passenger'; // Default to passenger if no role specified
    
    // Find user based on selected role
    if (userRole === 'admin') {
      // Hardcoded admin credentials
      if (email === 'admin' && password === 'admin') {
        user = {
          id: 'admin',
          name: 'System Administrator',
          email: 'admin',
          role: 'admin',
          profilePicture: '/images/default-profile.png'
        };
        console.log('Admin login successful with hardcoded credentials');
      }
    } else if (userRole === 'driver') {
      // Find driver in MongoDB
      const driver = await Driver.findOne({ email });
      console.log('Driver search result:', driver ? {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        password: driver.password ? (driver.password.substring(0, 3) + '...') : 'undefined'
      } : 'Not found');
      
      if (driver) {
        // Try comparing with bcrypt first (for hashed passwords)
        let isPasswordValid = false;
        
        try {
          // Check if the password is already hashed (starts with $2a$, $2b$, etc.)
          const isHashed = driver.password && driver.password.match(/^\$2[aby]\$\d+\$/);
          console.log('Password is hashed:', isHashed ? 'Yes' : 'No');
          
          if (isHashed) {
            isPasswordValid = await bcrypt.compare(password, driver.password);
          } else {
            // For plain text passwords during transition
            console.log('Comparing plain text passwords:');
            console.log('Input password:', password);
            console.log('Stored password:', driver.password);
            isPasswordValid = (driver.password === password);
          }
          
          console.log('Password validation:', isPasswordValid ? 'Success' : 'Failed');
        } catch (err) {
          console.error('Password comparison error:', err);
          // If bcrypt fails (e.g., password is not hashed), fall back to direct comparison
          isPasswordValid = (driver.password === password);
          console.log('Fallback password validation:', isPasswordValid ? 'Success' : 'Failed');
        }
        
        if (isPasswordValid) {
          user = {
            id: driver._id,
            name: driver.name,
            email: driver.email,
            role: 'driver',
            profilePicture: driver.profilePicture || '/images/default-profile.png'
          };
          console.log('User object created:', user);
        }
      }
    } else {
      // Find passenger in MongoDB
      const passenger = await Passenger.findOne({ email });
      console.log('Passenger found:', passenger ? 'Yes' : 'No');
      
      if (passenger) {
        // Try comparing with bcrypt first (for hashed passwords)
        let isPasswordValid = false;
        
        try {
          // Check if the password is already hashed (starts with $2a$, $2b$, etc.)
          if (passenger.password.match(/^\$2[aby]\$\d+\$/)) {
            isPasswordValid = await bcrypt.compare(password, passenger.password);
          } else {
            // For plain text passwords during transition
            isPasswordValid = (passenger.password === password);
          }
          
          console.log('Password validation:', isPasswordValid ? 'Success' : 'Failed');
        } catch (err) {
          console.error('Password comparison error:', err);
          // If bcrypt fails (e.g., password is not hashed), fall back to direct comparison
          isPasswordValid = (passenger.password === password);
        }
        
        if (isPasswordValid) {
          user = {
            id: passenger._id,
            name: passenger.name,
            email: passenger.email,
            role: 'passenger',
            profilePicture: passenger.profilePicture || '/images/default-profile.png'
          };
        }
      }
    }

    if (!user) {
      console.log('Login failed: Invalid credentials');
      return res.render('auth/login', {
        title: 'Login to MyTaxi',
        error: 'Invalid email or password'
      });
    }

    // Store user in session
    req.session.user = user;
    console.log('Login successful for:', user.email, 'as', user.role);

    // Redirect based on role
    if (user.role === 'admin') {
      return res.redirect('/admin');
    }
    if (user.role === 'driver') {
      return res.redirect('/driver');
    }
    return res.redirect('/passenger');
  } catch (error) {
    console.error('Login error:', error);
    return res.render('auth/login', {
      title: 'Login to MyTaxi',
      error: 'An error occurred during login. Please try again.'
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
    console.log('Registration request received');
    console.log('Registration request body:', req.body);
    const { 
      name, 
      email, 
      password, 
      role,
      phone,
      studentId,
      faculty,
      // Driver specific fields
      carModel,
      carPlateNumber,
      license_number,
      status,
      joined_at,
      updated_at,
      rating_count,
      average_rating
    } = req.body;
    
    console.log('Extracted fields:', { name, email, role, phone, studentId, faculty });
    console.log('Driver fields:', { carModel, carPlateNumber, license_number });
    
    const userRole = role || 'passenger'; // Default to passenger if no role specified
    console.log('User role determined as:', userRole);
    
    // Check if user already exists in the appropriate collection
    let existingUser = null;
    
    if (userRole === 'driver') {
      existingUser = await Driver.findOne({ email });
    } else {
      existingUser = await Passenger.findOne({ email });
    }
    
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.render('auth/register', {
        title: 'Register for MyTaxi',
        error: 'An account with that email already exists. Please log in instead.'
      });
    }
    
    // Create new user in the appropriate collection
    let newUser;
    
    if (userRole === 'driver') {
      // Create driver with all fields from the form
      console.log('Creating new driver with data:', {
        name, email, phone, studentId, faculty,
        carModel, carPlateNumber, license_number
      });
      
      newUser = new Driver({
        name,
        email,
        password,
        phone,
        studentId,
        faculty,
        carModel,
        carPlateNumber,
        license_number,
        status: status || 'available',
        joined_at: joined_at || new Date(),
        updated_at: updated_at || new Date(),
        average_rating: average_rating || 0,
        rating_count: rating_count || 0
      });
      
      console.log('Driver model created:', newUser);
      await newUser.save();
      console.log('Driver created successfully with ID:', newUser._id);
      
      // Create session user object
      const sessionUser = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: 'driver',
        profilePicture: newUser.profilePicture || '/images/default-profile.png'
      };
      
      req.session.user = sessionUser;
      return res.redirect('/driver');
    } else {
      // Create passenger with all fields from the form
      console.log('Creating new passenger with data:', {
        name, email, phone, studentId, faculty
      });
      
      newUser = new Passenger({
        name,
        email,
        password,
        phone,
        studentId,
        faculty,
        joined_at: new Date(),
        updated_at: new Date(),
        average_rating: 0,
        rating_count: 0
      });
      
      console.log('Passenger model created:', newUser);
      await newUser.save();
      console.log('Passenger created successfully with ID:', newUser._id);
      
      // Create session user object
      const sessionUser = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: 'passenger',
        profilePicture: newUser.profilePicture || '/images/default-profile.png'
      };
      
      req.session.user = sessionUser;
      return res.redirect('/passenger');
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.render('auth/register', {
      title: 'Register for MyTaxi',
      error: 'An error occurred during registration. Please try again.'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// API Endpoints for User Management
// These would typically be in a separate API routes file in a real application

// Get user by ID
router.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const role = req.query.role || 'passenger';
    let user;
    
    if (role === 'driver') {
      user = await Driver.findById(userId).select('-password');
    } else if (role === 'passenger') {
      user = await Passenger.findById(userId).select('-password');
    } else if (role === 'admin') {
      // For admin, still using in-memory store temporarily
      user = adminUsers.find(u => u.id === userId);
      if (user) {
        const { password, ...safeUser } = user;
        return res.json(safeUser);
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user by ID
router.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const role = req.query.role || 'passenger';
    let result;
    
    if (role === 'driver') {
      result = await Driver.findByIdAndDelete(userId);
    } else if (role === 'passenger') {
      result = await Passenger.findByIdAndDelete(userId);
    } else if (role === 'admin') {
      // For admin, still using in-memory store temporarily
      const userIndex = adminUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      adminUsers.splice(userIndex, 1);
      result = true;
    }
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If the user being deleted is the current user, destroy the session
    if (req.session.user && req.session.user.id === userId) {
      req.session.destroy();
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
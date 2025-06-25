const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'MyTaxi - UTeM Student Ride Service',
    user: req.session.user || null
  });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About MyTaxi',
    user: req.session.user || null
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    user: req.session.user || null
  });
});

// FAQ page
router.get('/faq', (req, res) => {
  res.render('faq', { 
    title: 'Frequently Asked Questions',
    user: req.session.user || null
  });
});

module.exports = router; 
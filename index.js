const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const methodOverride = require('method-override');
const ejsLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = require('./src/models/db');
connectDB();

// Import routes
const indexRoutes = require('./src/routes/index');
const authRoutes = require('./src/routes/auth');
const passengerRoutes = require('./src/routes/passenger');
const driverRoutes = require('./src/routes/driver');
const adminRoutes = require('./src/routes/admin');

const app = express();
const port = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');

// EJS Layouts
app.use(ejsLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request body:', req.body);
  }
  next();
});

app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(express.static(path.join(__dirname, 'src/public')));

// Serve node_modules files that are needed in the frontend
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'mytaxi-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true in production with HTTPS
}));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  delete req.session.success;
  delete req.session.error;
  next();
});

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/passenger', passengerRoutes);
app.use('/driver', driverRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(port, () => {
  console.log(`MyTaxi app listening on port ${port}`);
}); 
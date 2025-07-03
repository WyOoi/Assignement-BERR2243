const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load models
const Passenger = require('./src/models/passenger');
const Driver = require('./src/models/driver');
const Admin = require('./src/models/admin');

// Load environment variables
dotenv.config();

// MongoDB connection string
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/mytaxi';

// Connect to MongoDB
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Clear existing data
    await Passenger.deleteMany({});
    await Driver.deleteMany({});
    await Admin.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create test passenger
    const passenger = new Passenger({
      name: 'Demo Passenger',
      email: 'passenger@utem.edu.my',
      password: 'test',
      phone: '0123456789',
    });
    await passenger.save();
    
    // Create test driver
    const driver = new Driver({
      name: 'Demo Driver',
      email: 'driver@utem.edu.my',
      password: 'test',
      phone: '0123456789',
      licenseNumber: 'DRV12345',
      carModel: 'Toyota Camry',
      carPlateNumber: 'ABC 1234',
      isAvailable: true,
    });
    await driver.save();
    
    // Create test admin
    const admin = new Admin({
      name: 'Demo Admin',
      email: 'admin@utem.edu.my',
      password: 'test',
    });
    await admin.save();
    
    console.log('Test data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 
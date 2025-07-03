const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Driver = require('./src/models/driver');

// Load environment variables
dotenv.config();

// MongoDB connection string
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://Weiyuan:1234@wy.4ls5maw.mongodb.net/MyTaxi';

// Connect to MongoDB
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Test credentials
    const testEmail = 'wei.yuan@example.com';
    const testPassword = '12345678';
    
    console.log(`Testing authentication for: ${testEmail}`);
    
    // Find the driver by email
    const driver = await Driver.findOne({ email: testEmail });
    
    if (!driver) {
      console.log('Driver not found');
      process.exit(1);
    }
    
    console.log('Driver found:');
    console.log('Name:', driver.name);
    console.log('Email:', driver.email);
    console.log('Password:', driver.password);
    
    // Test direct password comparison
    const directMatch = driver.password === testPassword;
    console.log('Direct password comparison:', directMatch ? 'MATCH' : 'NO MATCH');
    
    // Test using the model's comparePassword method
    const methodMatch = await driver.comparePassword(testPassword);
    console.log('comparePassword method:', methodMatch ? 'MATCH' : 'NO MATCH');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 
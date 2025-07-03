const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load models
const Passenger = require('./src/models/passenger');
const Driver = require('./src/models/driver');
const Admin = require('./src/models/admin');

// Load environment variables
dotenv.config();

// MongoDB connection string - add the database name "MyTaxi" at the end
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://Weiyuan:1234@wy.4ls5maw.mongodb.net/MyTaxi';

// Function to hash a password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Connect to MongoDB
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Target driver email and password - using exact values from your MQL shell
    const driverEmail = "wei.yuan@example.com";
    const plainPassword = "12345678";
    
    // Find the driver by email
    const driver = await Driver.findOne({ email: driverEmail });
    
    if (driver) {
      console.log(`Found driver: ${driverEmail}`);
      console.log('Current document:', JSON.stringify(driver, null, 2));
      
      // Hash the password
      const hashedPassword = await hashPassword(plainPassword);
      
      // Update the driver with the hashed password
      driver.password = hashedPassword;
      await driver.save();
      
      console.log(`Updated password for driver: ${driverEmail}`);
    } else {
      console.log(`Driver not found: ${driverEmail}`);
    }
    
    // You can add similar code for other users if needed
    
    console.log('Password update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 
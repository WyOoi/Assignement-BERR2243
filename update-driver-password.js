const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection string
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://Weiyuan:1234@wy.4ls5maw.mongodb.net/MyTaxi';

// Connect directly to MongoDB without using models
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Get the driver collection directly
    const db = mongoose.connection.db;
    const driverCollection = db.collection('driver');
    
    // Email and password to set
    const driverEmail = 'wei.yuan@example.com';
    const plainPassword = '12345678';
    
    // Update the driver document directly
    const result = await driverCollection.updateOne(
      { email: driverEmail },
      { $set: { password: plainPassword } }
    );
    
    if (result.matchedCount === 0) {
      console.log(`Driver not found: ${driverEmail}`);
    } else if (result.modifiedCount === 0) {
      console.log(`Driver found but password was already set to "${plainPassword}"`);
    } else {
      console.log(`Successfully updated password for ${driverEmail} to plain text "${plainPassword}"`);
    }
    
    // Verify the update
    const driver = await driverCollection.findOne({ email: driverEmail });
    if (driver) {
      console.log('Updated driver:');
      console.log('Name:', driver.name);
      console.log('Email:', driver.email);
      console.log('Password:', driver.password);
    }
    
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
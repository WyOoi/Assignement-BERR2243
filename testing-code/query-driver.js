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
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    // Query the driver collection (singular)
    const driverCollection = db.collection('driver');
    const drivers = await driverCollection.find({}).toArray();
    
    console.log('\nDrivers in the database:');
    if (drivers.length === 0) {
      console.log('No drivers found');
    } else {
      drivers.forEach(driver => {
        console.log(`\nDriver ID: ${driver._id}`);
        console.log(`Name: ${driver.name}`);
        console.log(`Email: ${driver.email}`);
        console.log(`Password: ${driver.password}`);
        console.log(`Phone: ${driver.phone}`);
        console.log('All fields:', JSON.stringify(driver, null, 2));
      });
    }
    
    // Try to find the specific driver
    const specificDriver = await driverCollection.findOne({ email: "wei.yuan@example.com" });
    console.log('\nSearching for driver with email: wei.yuan@example.com');
    if (specificDriver) {
      console.log('Driver found!');
      console.log(JSON.stringify(specificDriver, null, 2));
    } else {
      console.log('Driver not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 
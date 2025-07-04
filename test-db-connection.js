const mongoose = require('mongoose');
const connectDB = require('./src/models/db');

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    
    // Check if connection is successful
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB connection is successful!');
      console.log('Connection details:');
      console.log('- Database name:', mongoose.connection.db.databaseName);
      console.log('- Host:', mongoose.connection.host);
      console.log('- Port:', mongoose.connection.port);
      
      // List collections
      console.log('\nAvailable collections:');
      const collections = await mongoose.connection.db.listCollections().toArray();
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Count documents in passenger collection
      try {
        const passengerCount = await mongoose.connection.db.collection('passenger').countDocuments();
        console.log('\nPassenger collection has', passengerCount, 'documents');
      } catch (err) {
        console.log('\nCould not count passenger documents:', err.message);
      }
      
      // Count documents in driver collection
      try {
        const driverCount = await mongoose.connection.db.collection('driver').countDocuments();
        console.log('Driver collection has', driverCount, 'documents');
      } catch (err) {
        console.log('Could not count driver documents:', err.message);
      }
      
      // Count documents in rides collection
      try {
        const ridesCount = await mongoose.connection.db.collection('rides').countDocuments();
        console.log('Rides collection has', ridesCount, 'documents');
      } catch (err) {
        console.log('Could not count rides documents:', err.message);
      }
      
      // Count documents in payments collection
      try {
        const paymentsCount = await mongoose.connection.db.collection('payments').countDocuments();
        console.log('Payments collection has', paymentsCount, 'documents');
      } catch (err) {
        console.log('Could not count payments documents:', err.message);
      }
    } else {
      console.log('MongoDB connection failed. Connection state:', mongoose.connection.readyState);
    }
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
}

testConnection(); 
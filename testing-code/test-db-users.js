const mongoose = require('mongoose');
const connectDB = require('../src/models/db');
const Passenger = require('../src/models/passenger');
const Driver = require('../src/models/driver');

async function testDBConnection() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB successfully');
    
    // Fetch passengers
    const passengers = await Passenger.find();
    console.log(`Found ${passengers.length} passengers:`);
    passengers.forEach((p, i) => {
      console.log(`${i+1}. ${p.name} (${p._id}) - ${p.email}`);
    });
    
    // Fetch drivers
    const drivers = await Driver.find();
    console.log(`\nFound ${drivers.length} drivers:`);
    drivers.forEach((d, i) => {
      console.log(`${i+1}. ${d.name} (${d._id}) - ${d.email}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testDBConnection(); 
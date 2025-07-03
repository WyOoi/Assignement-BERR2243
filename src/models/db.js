const mongoose = require('mongoose');

// MongoDB connection string - replace with your actual connection string
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://Weiyuan:1234@wy.4ls5maw.mongodb.net/MyTaxi';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 
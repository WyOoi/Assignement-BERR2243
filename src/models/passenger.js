const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passengerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  joined_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  average_rating: {
    type: Number,
    default: 0
  },
  rating_count: {
    type: Number,
    default: 0
  },
  studentId: {
    type: String,
    trim: true
  },
  faculty: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: '/images/default-profile.png'
  }
});

// Hash the password before saving - TEMPORARILY DISABLED
/*
passengerSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
*/

// Method to compare passwords
passengerSchema.methods.comparePassword = async function(candidatePassword) {
  // First try direct comparison for plain text passwords
  if (this.password === candidatePassword) {
    return true;
  }
  
  // Then try bcrypt compare for hashed passwords
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Specify the collection name explicitly as 'passenger' (singular)
const Passenger = mongoose.model('Passenger', passengerSchema, 'passenger');

module.exports = Passenger; 
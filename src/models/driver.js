const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
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
  license_number: {
    type: String,
    trim: true
  },
  carModel: {
    type: String,
    trim: true
  },
  carPlateNumber: {
    type: String,
    trim: true
  },
  studentId: {
    type: String,
    trim: true
  },
  faculty: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'available',
    enum: ['available', 'busy', 'offline']
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
  // Legacy fields from previous model - keeping for compatibility
  licenseNumber: String,
  profilePicture: {
    type: String,
    default: '/images/default-profile.png'
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: {
      lat: Number,
      lng: Number
    },
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash the password before saving - TEMPORARILY DISABLED
/*
driverSchema.pre('save', async function(next) {
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
driverSchema.methods.comparePassword = async function(candidatePassword) {
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

// Specify the collection name explicitly as 'driver' (singular)
const Driver = mongoose.model('Driver', driverSchema, 'driver');

module.exports = Driver; 
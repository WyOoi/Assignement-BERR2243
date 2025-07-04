const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passenger',
    required: true
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  pickup_location: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  passengers: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'pending'
  },
  requested_at: {
    type: Date,
    default: Date.now
  },
  accepted_at: {
    type: Date,
    default: null
  },
  started_at: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  }
});

// Specify the collection name explicitly as 'ride' (singular)
const Ride = mongoose.model('Ride', rideSchema, 'rides');

module.exports = Ride; 
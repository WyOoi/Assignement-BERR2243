const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  ride_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  distance_km: {
    type: Number,
    required: true
  },
  fare_amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'wallet'],
    required: true
  },
  paid_at: {
    type: Date,
    default: Date.now
  },
  payment_status: {
    type: String,
    enum: ['paid', 'failed', 'refunded'],
    default: 'paid'
  },
  reported_at: {
    type: Date,
    default: Date.now
  }
});

// Specify the collection name explicitly as 'reports'
const Report = mongoose.model('Report', reportSchema, 'report');

module.exports = Report; 
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  ride_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'wallet'],
    required: true
  },
  paid_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'driver_confirmed', 'passenger_confirmed', 'completed', 'failed', 'refunded'],
    default: 'pending'
  }
});

// Specify the collection name explicitly as 'payments'
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

module.exports = Payment; 
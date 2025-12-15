const mongoose = require('mongoose');

const fw1TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'income',
      'spending',
      'income_reversal',
      'spending_reversal',
      'income_adjustment',
      'spending_adjustment',
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FW1Invoice',
  },
  invoiceRef: String,
  description: {
    type: String,
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

fw1TransactionSchema.index({ date: -1 });
fw1TransactionSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('FW1Transaction', fw1TransactionSchema);


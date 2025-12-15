const mongoose = require('mongoose');

const fw2TransactionSchema = new mongoose.Schema({
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
    ref: 'FW2Invoice',
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

fw2TransactionSchema.index({ date: -1 });
fw2TransactionSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('FW2Transaction', fw2TransactionSchema);


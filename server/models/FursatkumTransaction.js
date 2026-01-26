const mongoose = require('mongoose');

const fursatkumTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'income',
      'spending',
      'income_reversal',
      'spending_reversal',
      'income_adjustment',
      'spending_adjustment',
      'employee_loan_given',
      'employee_loan_repayment',
      'salary_payment',
      'salary_loan_deduction',
    ],
    required: true,
  },
  ledger: {
    type: String,
    enum: ['cash', 'bank'],
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
    ref: 'FursatkumInvoice',
  },
  invoiceRef: {
    type: String,
  },
  description: {
    type: String,
    trim: true,
  },
  reason: {
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

// Indexes for efficient queries
fursatkumTransactionSchema.index({ ledger: 1, date: -1 });
fursatkumTransactionSchema.index({ type: 1 });
fursatkumTransactionSchema.index({ invoiceId: 1 });
fursatkumTransactionSchema.index({ date: -1 });

module.exports = mongoose.model('FursatkumTransaction', fursatkumTransactionSchema);



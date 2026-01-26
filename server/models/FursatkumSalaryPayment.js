const mongoose = require('mongoose');

const fursatkumSalaryPaymentSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FursatkumEmployee',
    required: true,
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  grossSalary: {
    type: Number,
    required: true,
    min: 0.001,
  },
  loanDeducted: {
    type: Number,
    default: 0,
    min: 0,
  },
  netPaid: {
    type: Number,
    required: true,
    min: 0,
  },
  ledger: {
    type: String,
    enum: ['cash', 'bank'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

fursatkumSalaryPaymentSchema.index({ employeeId: 1, date: -1 });
fursatkumSalaryPaymentSchema.index({ referenceNumber: 1 });

module.exports = mongoose.model('FursatkumSalaryPayment', fursatkumSalaryPaymentSchema);


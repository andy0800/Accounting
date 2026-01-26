const mongoose = require('mongoose');

const fursatkumEmployeeLoanSchema = new mongoose.Schema({
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
  originalAmount: {
    type: Number,
    required: true,
    min: 0.001,
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  monthlyDeduction: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'cancelled'],
    default: 'active',
  },
  description: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

fursatkumEmployeeLoanSchema.index({ employeeId: 1, status: 1 });
fursatkumEmployeeLoanSchema.index({ referenceNumber: 1 });

module.exports = mongoose.model('FursatkumEmployeeLoan', fursatkumEmployeeLoanSchema);


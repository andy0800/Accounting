const mongoose = require('mongoose');

const fursatkumEmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  monthlySalary: {
    type: Number,
    required: true,
    min: 0.001,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  notes: {
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

fursatkumEmployeeSchema.index({ name: 1 });
fursatkumEmployeeSchema.index({ status: 1 });

module.exports = mongoose.model('FursatkumEmployee', fursatkumEmployeeSchema);


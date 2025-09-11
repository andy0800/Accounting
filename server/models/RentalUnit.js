const mongoose = require('mongoose');

const rentalUnitSchema = new mongoose.Schema({
  unitType: {
    type: String,
    required: [true, 'نوع الوحدة مطلوب'],
    trim: true
  },
  unitNumber: {
    type: String,
    required: [true, 'رقم الوحدة مطلوب'],
    trim: true,
    unique: true
  },
  address: {
    type: String,
    required: [true, 'عنوان الوحدة مطلوب'],
    trim: true
  },
  rentAmount: {
    type: Number,
    required: [true, 'مبلغ الإيجار مطلوب'],
    min: [0, 'مبلغ الإيجار يجب أن يكون موجب']
  },
  secretaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentingSecretary',
    // Optional: allows units to be pre-assigned to secretaries
  },
  status: {
    type: String,
    enum: ['متاح', 'نشط', 'منتهي', 'صيانة'],
    default: 'متاح' // Default to available
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better search performance
rentalUnitSchema.index({ unitNumber: 1, secretaryId: 1, status: 1 });

module.exports = mongoose.model('RentalUnit', rentalUnitSchema);

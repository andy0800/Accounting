const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name: String,
  filePath: String,
  uploadDate: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const rentalUnitSchema = new mongoose.Schema({
  unitType: {
    type: String,
    required: [true, 'نوع الوحدة مطلوب'],
    trim: true,
  },
  unitNumber: {
    type: String,
    required: [true, 'رقم الوحدة مطلوب'],
    unique: true,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'عنوان الوحدة مطلوب'],
    trim: true,
  },
  rentAmount: {
    type: Number,
    required: [true, 'مبلغ الإيجار مطلوب'],
    min: [0, 'مبلغ الإيجار يجب أن يكون أكبر من صفر'],
  },
  currency: {
    type: String,
    enum: ['KWD'],
    default: 'KWD',
  },
  status: {
    type: String,
    enum: ['متاح', 'نشط', 'منتهي', 'صيانة'],
    default: 'متاح',
  },
  notes: {
    type: String,
    trim: true,
  },
  attachments: [attachmentSchema],
  currentContract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalContract',
  },
  history: [{
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalContract',
    },
    action: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    meta: mongoose.Schema.Types.Mixed,
  }],
}, {
  timestamps: true,
});

rentalUnitSchema.index({ unitType: 1, status: 1 });

module.exports = mongoose.model('RentalUnit', rentalUnitSchema);


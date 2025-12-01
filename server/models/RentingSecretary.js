const mongoose = require('mongoose');

const rentalSecretarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم السكرتير مطلوب'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
  },
  idNumber: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['نشط', 'غير نشط'],
    default: 'نشط',
  },
  documents: [{
    name: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }],
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

rentalSecretarySchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('RentingSecretary', rentalSecretarySchema);


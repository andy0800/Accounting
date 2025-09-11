const mongoose = require('mongoose');

const rentingSecretarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم السكرتير مطلوب'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  idNumber: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['نشط', 'غير نشط'],
    default: 'نشط'
  }
}, {
  timestamps: true
});

// Index for better search performance
rentingSecretarySchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('RentingSecretary', rentingSecretarySchema);

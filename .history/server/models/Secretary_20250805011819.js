const mongoose = require('mongoose');

const secretarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم السكرتيرة مطلوب'],
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 2
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDebt: {
    type: Number,
    default: 0
  },
  activeVisas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa'
  }],
  completedVisas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa'
  }],
  cancelledVisas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// توليد رمز من حرفين من الاسم
secretarySchema.pre('save', function(next) {
  if (!this.code) {
    const nameParts = this.name.split(' ');
    if (nameParts.length >= 2) {
      this.code = (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    } else {
      this.code = this.name.substring(0, 2).toUpperCase();
    }
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Secretary', secretarySchema); 
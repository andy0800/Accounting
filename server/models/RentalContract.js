const mongoose = require('mongoose');

const rentalContractSchema = new mongoose.Schema({
  secretaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentingSecretary',
    required: [true, 'السكرتير مطلوب']
  },
  unitType: {
    type: String,
    required: [true, 'نوع الوحدة المؤجرة مطلوب'],
    trim: true
  },
  unitNumber: {
    type: String,
    required: [true, 'رقم الوحدة مطلوب'],
    trim: true
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
  startDate: {
    type: Date,
    required: [true, 'تاريخ بدء العقد مطلوب']
  },
  dueDay: {
    type: Number,
    required: [true, 'يوم الاستحقاق مطلوب'],
    min: [1, 'يوم الاستحقاق يجب أن يكون بين 1 و 31'],
    max: [31, 'يوم الاستحقاق يجب أن يكون بين 1 و 31']
  },
  status: {
    type: String,
    enum: ['نشط', 'منتهي'],
    default: 'نشط'
  },
  terminationDate: {
    type: Date
  },
  terminationReason: {
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
  // Fixed reference number for rental contract
  referenceNumber: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

// Index for better search performance
rentalContractSchema.index({ secretaryId: 1, status: 1 });
rentalContractSchema.index({ unitNumber: 1, status: 1 });
rentalContractSchema.index({ referenceNumber: 1 }, { unique: true, sparse: true });

// Generate reference number on create if missing
rentalContractSchema.pre('save', function(next) {
	if (!this.referenceNumber) {
		const created = this.createdAt ? new Date(this.createdAt) : new Date();
		const year = created.getFullYear();
		const shortId = this._id ? this._id.toString().slice(-6).toUpperCase() : Math.random().toString(36).slice(-6).toUpperCase();
		this.referenceNumber = `RC-${year}-${shortId}`;
	}
	next();
});

module.exports = mongoose.model('RentalContract', rentalContractSchema);

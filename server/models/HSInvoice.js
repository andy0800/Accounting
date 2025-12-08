const mongoose = require('mongoose');

const editHistorySchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  editedAt: {
    type: Date,
    default: Date.now,
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const hsInvoiceSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['income', 'spending'],
    required: [true, 'نوع الفاتورة مطلوب'],
  },
  name: {
    type: String,
    required: [true, 'اسم الفاتورة مطلوب'],
    trim: true,
  },
  value: {
    type: Number,
    required: [true, 'قيمة الفاتورة مطلوبة'],
    min: [0.001, 'قيمة الفاتورة يجب أن تكون أكبر من صفر'],
  },
  currency: {
    type: String,
    enum: ['KWD'],
    default: 'KWD',
  },
  date: {
    type: Date,
    required: [true, 'تاريخ الفاتورة مطلوب'],
  },
  details: {
    type: String,
    trim: true,
  },
  document: documentSchema,
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editHistory: [editHistorySchema],
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
hsInvoiceSchema.index({ type: 1, status: 1 });
hsInvoiceSchema.index({ referenceNumber: 1 });
hsInvoiceSchema.index({ date: -1 });
hsInvoiceSchema.index({ status: 1, date: -1 });

module.exports = mongoose.model('HSInvoice', hsInvoiceSchema);


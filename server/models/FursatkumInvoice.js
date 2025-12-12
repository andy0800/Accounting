const mongoose = require('mongoose');

const editHistorySchema = new mongoose.Schema({
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String, required: true },
  editedAt: { type: Date, default: Date.now },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const fursatkumInvoiceSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['income', 'spending'],
    required: true,
  },
  ledger: {
    type: String,
    enum: ['cash', 'bank'],
    required: true,
  },
  bankReference: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
    min: [0.001, 'قيمة الفاتورة يجب أن تكون أكبر من صفر'],
  },
  currency: {
    type: String,
    enum: ['KWD'],
    default: 'KWD',
  },
  date: {
    type: Date,
    required: true,
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
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deleteReason: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Indexes for efficient queries
fursatkumInvoiceSchema.index({ type: 1, status: 1 });
fursatkumInvoiceSchema.index({ referenceNumber: 1 });
fursatkumInvoiceSchema.index({ date: -1 });
fursatkumInvoiceSchema.index({ status: 1, date: -1 });
fursatkumInvoiceSchema.index({ ledger: 1, type: 1, status: 1 });

module.exports = mongoose.model('FursatkumInvoice', fursatkumInvoiceSchema);



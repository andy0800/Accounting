const mongoose = require('mongoose');

const hsTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'add_funds',           // إضافة رصيد تمويل
      'income',              // فاتورة دخل
      'spending',            // إيصال صرف
      'income_reversal',     // عكس فاتورة دخل (حذف)
      'spending_reversal',   // عكس إيصال صرف (حذف)
      'income_adjustment',   // تعديل قيمة فاتورة دخل
      'spending_adjustment', // تعديل قيمة إيصال صرف
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['funding', 'income'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HSInvoice',
  },
  invoiceRef: {
    type: String,
  },
  description: {
    type: String,
    required: function() {
      return this.type === 'add_funds';
    },
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
hsTransactionSchema.index({ category: 1, date: -1 });
hsTransactionSchema.index({ type: 1 });
hsTransactionSchema.index({ invoiceId: 1 });
hsTransactionSchema.index({ date: -1 });

module.exports = mongoose.model('HSTransaction', hsTransactionSchema);


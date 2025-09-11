const mongoose = require('mongoose');

const rentalPaymentSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalContract',
    required: [true, 'العقد مطلوب']
  },
  monthYear: {
    type: String,
    required: [true, 'الشهر والسنة مطلوبان'],
    // Format: "2024-06" for June 2024
    match: [/^\d{4}-\d{2}$/, 'تنسيق الشهر والسنة غير صحيح']
  },
  amount: {
    type: Number,
    required: [true, 'مبلغ الدفعة مطلوب'],
    min: [0, 'مبلغ الدفعة يجب أن يكون موجب']
  },
  paymentDate: {
    type: Date,
    required: [true, 'تاريخ الدفع مطلوب'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    default: 'دفعة إيجار'
  },
  isPartial: {
    type: Boolean,
    default: false
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: [0, 'الرصيد المتبقي يجب أن يكون موجب']
  },
  receiptDocument: {
    name: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  paymentMethod: {
    type: String,
    enum: ['نقدي', 'تحويل بنكي', 'شيك', 'بطاقة ائتمان'],
    default: 'نقدي'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better search performance
rentalPaymentSchema.index({ contractId: 1, monthYear: 1, paymentDate: 1 });
rentalPaymentSchema.index({ monthYear: 1, isPartial: 1 });

module.exports = mongoose.model('RentalPayment', rentalPaymentSchema);

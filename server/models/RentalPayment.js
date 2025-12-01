const mongoose = require('mongoose');

const rentalPaymentSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalContract',
    required: true,
  },
  monthYear: {
    type: String,
    required: true, // YYYY-MM
  },
  amount: {
    type: Number,
    required: [true, 'مبلغ الدفع مطلوب'],
    min: [0, 'مبلغ الدفع يجب أن يكون أكبر من صفر'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ['Cash', 'KNET/Link'],
    required: true,
  },
  transactionRef: {
    type: String,
    trim: true,
  },
  notes: String,
  enteredBy: {
    type: String,
  },
  remainingBalance: {
    type: Number,
    default: 0,
  },
  isPartial: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

rentalPaymentSchema.index({ contractId: 1, monthYear: 1 });

rentalPaymentSchema.pre('validate', function validateTransaction(next) {
  if (this.method === 'KNET/Link' && !this.transactionRef) {
    this.invalidate('transactionRef', 'رقم مرجع المعاملة مطلوب لمدفوعات KNET/Link');
  }
  next();
});

module.exports = mongoose.model('RentalPayment', rentalPaymentSchema);


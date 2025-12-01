const mongoose = require('mongoose');
const dayjs = require('dayjs');

const rentalMonthSchema = new mongoose.Schema({
  monthIndex: Number,
  monthYear: {
    type: String,
    required: true, // format YYYY-MM
  },
  dueDate: {
    type: Date,
    required: true,
  },
  dueAmount: {
    type: Number,
    required: true,
  },
  totalPaid: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
    default: function defaultRemaining() {
      return this.dueAmount;
    },
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Overdue'],
    default: 'Pending',
  },
  payments: [{
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalPayment',
    },
    amount: Number,
    method: {
      type: String,
      enum: ['Cash', 'KNET/Link'],
    },
    transactionRef: String,
    paymentDate: Date,
  }],
}, { _id: false });

const rentalContractSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalUnit',
    required: true,
  },
  unitSnapshot: {
    unitType: String,
    unitNumber: String,
    address: String,
  },
  rentalSecretaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentingSecretary',
    required: true,
  },
  secretarySnapshot: {
    name: String,
    phone: String,
    email: String,
  },
  rentAmount: {
    type: Number,
    required: true,
    min: [0, 'مبلغ الإيجار يجب أن يكون أكبر من صفر'],
  },
  currency: {
    type: String,
    enum: ['KWD'],
    default: 'KWD',
  },
  startDate: {
    type: Date,
    required: true,
  },
  dueDay: {
    type: Number,
    min: 1,
    max: 31,
    required: true,
  },
  durationMonths: {
    type: Number,
    min: 1,
    max: 60,
    default: 12,
  },
  status: {
    type: String,
    enum: ['نشط', 'منتهي'],
    default: 'نشط',
  },
  terminationDate: Date,
  terminationReason: String,
  notes: String,
  documents: [{
    name: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }],
  months: [rentalMonthSchema],
}, {
  timestamps: true,
});

rentalContractSchema.index({ rentalSecretaryId: 1, status: 1 });
rentalContractSchema.index({ unitId: 1, status: 1 });
rentalContractSchema.index({ referenceNumber: 1 });

function padNumber(num, size = 4) {
  let s = String(num);
  while (s.length < size) s = `0${s}`;
  return s;
}

rentalContractSchema.statics.generateReferenceNumber = async function generateReferenceNumber() {
  const count = await this.countDocuments();
  const year = dayjs().format('YY');
  return `RC-${year}-${padNumber(count + 1, 5)}`;
};

function buildSchedule(startDate, dueDay, duration, rentAmount) {
  const base = dayjs(startDate);
  const schedule = [];

  for (let i = 0; i < duration; i += 1) {
    const scheduledDate = base.add(i, 'month').date(Math.min(dueDay, base.add(i, 'month').daysInMonth()));
    schedule.push({
      monthIndex: i,
      monthYear: scheduledDate.format('YYYY-MM'),
      dueDate: scheduledDate.toDate(),
      dueAmount: rentAmount,
      totalPaid: 0,
      remainingAmount: rentAmount,
      status: 'Pending',
      payments: [],
    });
  }

  return schedule;
}

rentalContractSchema.methods.ensureSchedule = function ensureSchedule() {
  if (!this.months || this.months.length === 0) {
    this.months = buildSchedule(this.startDate, this.dueDay, this.durationMonths, this.rentAmount);
  }
};

rentalContractSchema.pre('save', async function preSave(next) {
  if (!this.referenceNumber) {
    this.referenceNumber = await this.constructor.generateReferenceNumber();
  }
  this.ensureSchedule();
  next();
});

module.exports = mongoose.model('RentalContract', rentalContractSchema);


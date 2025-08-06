const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم الحساب مطلوب'],
    trim: true
  },
  type: {
    type: String,
    enum: ['شركة', 'سكرتيرة'],
    required: true
  },
  secretaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretary'
  },
  
  // البيانات المالية
  totalExpenses: {
    type: Number,
    default: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDebt: {
    type: Number,
    default: 0
  },
  
  // إحصائيات التأشيرات
  totalVisasBought: {
    type: Number,
    default: 0
  },
  totalVisasSold: {
    type: Number,
    default: 0
  },
  totalVisasCancelled: {
    type: Number,
    default: 0
  },
  activeVisas: {
    type: Number,
    default: 0
  },
  
  // الإحصائيات الشهرية/السنوية
  monthlyStats: [{
    year: Number,
    month: Number,
    expenses: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    visasBought: { type: Number, default: 0 },
    visasSold: { type: Number, default: 0 },
    visasCancelled: { type: Number, default: 0 }
  }],
  
  yearlyStats: [{
    year: Number,
    expenses: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    visasBought: { type: Number, default: 0 },
    visasSold: { type: Number, default: 0 },
    visasCancelled: { type: Number, default: 0 },
    averageProfitPerVisa: { type: Number, default: 0 }
  }],
  
  // الطوابع الزمنية
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// تحديث الطابع الزمني عند الحفظ
accountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// حساب متوسط الربح لكل تأشيرة
accountSchema.methods.calculateAverageProfitPerVisa = function() {
  if (this.totalVisasSold > 0) {
    return this.totalProfit / this.totalVisasSold;
  }
  return 0;
};

// تحديث الإحصائيات الشهرية
accountSchema.methods.updateMonthlyStats = function(year, month, data) {
  const monthIndex = this.monthlyStats.findIndex(
    stat => stat.year === year && stat.month === month
  );
  
  if (monthIndex >= 0) {
    this.monthlyStats[monthIndex] = { ...this.monthlyStats[monthIndex], ...data };
  } else {
    this.monthlyStats.push({ year, month, ...data });
  }
};

// تحديث الإحصائيات السنوية
accountSchema.methods.updateYearlyStats = function(year, data) {
  const yearIndex = this.yearlyStats.findIndex(stat => stat.year === year);
  
  if (yearIndex >= 0) {
    this.yearlyStats[yearIndex] = { ...this.yearlyStats[yearIndex], ...data };
  } else {
    this.yearlyStats.push({ year, ...data });
  }
};

module.exports = mongoose.model('Account', accountSchema); 
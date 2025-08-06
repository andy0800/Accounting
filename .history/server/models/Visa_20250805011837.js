const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'المبلغ مطلوب']
  },
  description: {
    type: String,
    required: [true, 'وصف المصروف مطلوب']
  },
  date: {
    type: Date,
    default: Date.now
  },
  stage: {
    type: String,
    enum: ['أ', 'ب', 'ج', 'د', 'استبدال'],
    required: true
  }
});

const visaSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'تاريخ الميلاد مطلوب']
  },
  nationality: {
    type: String,
    required: [true, 'الجنسية مطلوبة'],
    trim: true
  },
  passportNumber: {
    type: String,
    required: [true, 'رقم الجواز مطلوب'],
    trim: true
  },
  visaNumber: {
    type: String,
    required: [true, 'رقم التأشيرة مطلوب'],
    trim: true
  },
  
  // معلومات السكرتيرة والعملية
  secretary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretary',
    required: [true, 'السكرتيرة المسؤولة مطلوبة']
  },
  secretaryCode: {
    type: String,
    required: true
  },
  orderNumber: {
    type: Number,
    required: true
  },
  
  // معلومات المندوب والكفيل
  middlemanName: {
    type: String,
    trim: true
  },
  visaSponsor: {
    type: String,
    trim: true
  },
  
  // التواريخ
  visaIssueDate: {
    type: Date,
    required: [true, 'تاريخ إصدار التأشيرة مطلوب']
  },
  visaExpiryDate: {
    type: Date,
    required: [true, 'تاريخ انتهاء التأشيرة مطلوب']
  },
  visaDeadline: {
    type: Date,
    required: [true, 'الموعد النهائي للتأشيرة مطلوب']
  },
  
  // المستندات
  visaDocument: {
    type: String // مسار الملف
  },
  
  // المعلومات المالية
  secretaryProfitPercentage: {
    type: Number,
    required: [true, 'نسبة ربح السكرتيرة مطلوبة'],
    min: 0,
    max: 100
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  secretaryEarnings: {
    type: Number,
    default: 0
  },
  
  // معلومات العميل (للتأشيرات المباعة)
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  
  // مراحل العملية
  currentStage: {
    type: String,
    enum: ['أ', 'ب', 'ج', 'د', 'هـ', 'مكتملة', 'ملغاة', 'مباعة'],
    default: 'أ'
  },
  
  // حالة إكمال المراحل
  stageACompleted: {
    type: Boolean,
    default: false
  },
  stageBCompleted: {
    type: Boolean,
    default: false
  },
  stageCCompleted: {
    type: Boolean,
    default: false
  },
  stageDCompleted: {
    type: Boolean,
    default: false
  },
  stageECompleted: {
    type: Boolean,
    default: false
  },
  
  // المصروفات حسب المرحلة
  stageAExpenses: [expenseSchema],
  stageBExpenses: [expenseSchema],
  stageCExpenses: [expenseSchema],
  stageDExpenses: [expenseSchema],
  replacementExpenses: [expenseSchema],
  
  // معلومات الاستبدال
  isReplaced: {
    type: Boolean,
    default: false
  },
  originalVisa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa'
  },
  replacedVisa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa'
  },
  replacementDate: {
    type: Date
  },
  
  // الحالة والطوابع الزمنية
  status: {
    type: String,
    enum: ['قيد_الشراء', 'معروضة_للبيع', 'مباعة', 'ملغاة'],
    default: 'قيد_الشراء'
  },
  completedAt: {
    type: Date
  },
  soldAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledReason: {
    type: String
  },
  
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
visaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// حساب إجمالي المصروفات
visaSchema.methods.calculateTotalExpenses = function() {
  const stageA = this.stageAExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const stageB = this.stageBExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const stageC = this.stageCExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const stageD = this.stageDExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const replacement = this.replacementExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  this.totalExpenses = stageA + stageB + stageC + stageD + replacement;
  return this.totalExpenses;
};

// حساب الربح
visaSchema.methods.calculateProfit = function() {
  this.profit = this.sellingPrice - this.totalExpenses;
  return this.profit;
};

// حساب أرباح السكرتير
visaSchema.methods.calculateSecretaryEarnings = function() {
  this.secretaryEarnings = (this.profit * this.secretaryProfitPercentage) / 100;
  return this.secretaryEarnings;
};

// التحقق من تجاوز الموعد النهائي
visaSchema.methods.isOverdue = function() {
  return new Date() > this.visaDeadline;
};

module.exports = mongoose.model('Visa', visaSchema); 
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
  
  // معلومات وصول الخادمة والموعد النهائي الجديد
  maidArrivalVerified: {
    type: Boolean,
    default: false
  },
  maidArrivalDate: {
    type: Date
  },
  maidArrivalVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretary'
  },
  maidArrivalNotes: {
    type: String,
    trim: true
  },
  // الموعد النهائي النشط (يبدأ من تاريخ الوصول)
  activeCancellationDeadline: {
    type: Date
  },
  deadlineStatus: {
    type: String,
    enum: ['inactive', 'active', 'expired'],
    default: 'inactive'
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
  
  // معلومات عمولة البيع
  sellingSecretary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Secretary'
  },
  sellingCommission: {
    type: Number,
    default: 0
  },
  
  // مراحل العملية
  currentStage: {
    type: String,
    enum: ['أ', 'ب', 'ج', 'د', 'وصول', 'مكتملة', 'ملغاة', 'مباعة'],
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
    enum: ['قيد_الشراء', 'في_انتظار_الوصول', 'معروضة_للبيع', 'مباعة', 'ملغاة'],
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

// إضافة فهارس قاعدة البيانات لتحسين الأداء
visaSchema.index({ status: 1 }); // فهرس على حالة التأشيرة
visaSchema.index({ currentStage: 1 }); // فهرس على المرحلة الحالية
visaSchema.index({ secretary: 1 }); // فهرس على السكرتيرة
visaSchema.index({ createdAt: -1 }); // فهرس على تاريخ الإنشاء (ترتيب تنازلي)
visaSchema.index({ status: 1, currentStage: 1 }); // فهرس مركب للحالة والمرحلة
visaSchema.index({ secretary: 1, status: 1 }); // فهرس مركب للسكرتيرة والحالة

// حساب إجمالي المصروفات
visaSchema.methods.calculateTotalExpenses = function() {
  const stageA = this.stageAExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const stageB = this.stageBExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const stageC = this.stageCExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const stageD = this.stageDExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const replacement = this.replacementExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  this.totalExpenses = stageA + stageB + stageC + stageD + replacement + this.sellingCommission;
  return this.totalExpenses;
};

// حساب الموعد النهائي للإلغاء بناءً على تاريخ الوصول
visaSchema.methods.calculateArrivalBasedDeadline = function() {
  if (this.maidArrivalVerified && this.maidArrivalDate) {
    const deadline = new Date(this.maidArrivalDate);
    deadline.setDate(deadline.getDate() + 30); // 30 يوماً من تاريخ الوصول
    return deadline;
  }
  return null;
};

// تحديث حالة الموعد النهائي
visaSchema.methods.updateDeadlineStatus = function() {
  if (this.maidArrivalVerified && this.maidArrivalDate) {
    const now = new Date();
    const deadline = this.calculateArrivalBasedDeadline();
    
    if (deadline) {
      this.activeCancellationDeadline = deadline;
      
      if (now > deadline) {
        this.deadlineStatus = 'expired';
      } else {
        this.deadlineStatus = 'active';
      }
    }
  } else {
    this.deadlineStatus = 'inactive';
    this.activeCancellationDeadline = null;
  }
};

// التحقق من أهلية التحقق من الوصول
visaSchema.methods.isEligibleForArrivalVerification = function() {
  // يجب أن تكون التأشيرة في المرحلة د أو مكتملة
  const eligibleStages = ['د', 'مكتملة'];
  const eligibleStatuses = ['قيد_الشراء', 'معروضة_للبيع'];
  
  return eligibleStages.includes(this.currentStage) && 
         eligibleStatuses.includes(this.status) &&
         !this.maidArrivalVerified;
};

// حساب الأيام المتبقية قبل الإلغاء
visaSchema.methods.getDaysUntilCancellation = function() {
  if (this.deadlineStatus === 'active' && this.activeCancellationDeadline) {
    const now = new Date();
    const diffTime = this.activeCancellationDeadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return null;
};

// حساب الربح
visaSchema.methods.calculateProfit = function() {
  this.profit = this.sellingPrice - this.totalExpenses;
  return this.profit;
};

// حساب أرباح السكرتيرة
visaSchema.methods.calculateSecretaryEarnings = function() {
  this.secretaryEarnings = (this.profit * this.secretaryProfitPercentage) / 100;
  return this.secretaryEarnings;
};

// حساب ربح الشركة لكل تأشيرة
visaSchema.methods.calculateCompanyProfit = function() {
  return this.profit - this.secretaryEarnings;
};

// التحقق من تجاوز الموعد النهائي
visaSchema.methods.isOverdue = function() {
  return new Date() > this.visaDeadline;
};

module.exports = mongoose.model('Visa', visaSchema); 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Visa = require('../models/Visa');
const Secretary = require('../models/Secretary');
const Account = require('../models/Account');

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'تأشيرة-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('يُسمح فقط بملفات الصور و PDF والمستندات!'));
    }
  }
});

// التحقق من التأشيرات المتأخرة وإلغاؤها تلقائياً
const checkOverdueVisas = async () => {
  try {
    // النظام الجديد: البحث عن التأشيرات التي وصلت الخادمة ولها موعد نهائي نشط منتهي
    const overdueVisas = await Visa.find({
      maidArrivalVerified: true,
      deadlineStatus: 'active',
      activeCancellationDeadline: { $lt: new Date() },
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع', 'في_انتظار_الوصول'] }
    }).populate('secretary');

    for (const visa of overdueVisas) {
      // إلغاء التأشيرة
      visa.status = 'ملغاة';
      visa.cancelledAt = new Date();
      visa.cancelledReason = 'انتهاء الموعد النهائي بعد وصول الخادمة (30 يوماً)';
      visa.currentStage = 'ملغاة';
      visa.deadlineStatus = 'expired';
      await visa.save();

      // إضافة المصروفات كدين على السكرتيرة
      if (visa.secretary) {
        const secretary = await Secretary.findById(visa.secretary._id);
        if (secretary) {
          secretary.totalDebt += visa.totalExpenses;
          secretary.activeVisas = secretary.activeVisas.filter(id => id.toString() !== visa._id.toString());
          secretary.cancelledVisas.push(visa._id);
          await secretary.save();
        }
      }
    }

    // تحديث حالة المواعيد النهائية للتأشيرات النشطة
    const activeVisas = await Visa.find({
      maidArrivalVerified: true,
      deadlineStatus: 'active',
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع', 'في_انتظار_الوصول'] }
    });

    for (const visa of activeVisas) {
      visa.updateDeadlineStatus();
      await visa.save();
    }

    if (overdueVisas.length > 0) {
      console.log(`🔄 النظام الجديد: تم إلغاء ${overdueVisas.length} تأشيرة بعد انتهاء 30 يوماً من وصول الخادمة`);
    }
  } catch (error) {
    console.error('خطأ في التحقق من التأشيرات المتأخرة:', error);
  }
};

// الحصول على جميع التأشيرات مع الفلترة والترقيم (محسّن للأداء)
router.get('/', async (req, res) => {
  try {
    // Skip overdue check for better performance - run it separately
    // await checkOverdueVisas();
    
    const { status, stage, secretary, page = 1, limit = 10 } = req.query; // Reduced default limit
    let filter = {};
    
    if (status) filter.status = status;
    if (stage) filter.currentStage = stage;
    if (secretary) filter.secretary = secretary;
    
    // حساب الترقيم
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // جلب البيانات مع الترقيم
    const [visas, totalCount] = await Promise.all([
      Visa.find(filter)
        .populate('secretary', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Visa.countDocuments(filter)
    ]);
    
    res.json({
      visas,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على تأشيرة محددة
router.get('/:id', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id)
      .populate('secretary', 'name code')
      .populate('originalVisa')
      .populate('replacedVisa');
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }
    
    res.json(visa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إنشاء تأشيرة جديدة (المرحلة أ)
router.post('/', upload.single('visaDocument'), async (req, res) => {
  try {
    const {
      name, dateOfBirth, nationality, passportNumber, visaNumber,
      secretaryId, middlemanName, visaSponsor, visaIssueDate,
      visaExpiryDate, visaDeadline, secretaryProfitPercentage
    } = req.body;

      // الحصول على السكرتيرة
  const secretary = await Secretary.findById(secretaryId);
  if (!secretary) {
    return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
  }

    // الحصول على الرقم التسلسلي التالي لهذه السكرتيرة
    const lastVisa = await Visa.findOne({ secretary: secretaryId })
      .sort({ orderNumber: -1 });
    const orderNumber = lastVisa ? lastVisa.orderNumber + 1 : 1;

    const visa = new Visa({
      name,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      passportNumber,
      visaNumber,
      secretary: secretaryId,
      secretaryCode: secretary.code,
      orderNumber,
      middlemanName,
      visaSponsor,
      visaIssueDate: new Date(visaIssueDate),
      visaExpiryDate: new Date(visaExpiryDate),
      visaDeadline: new Date(visaDeadline),
      visaDocument: req.file ? req.file.filename : null,
      secretaryProfitPercentage: parseFloat(secretaryProfitPercentage),
      currentStage: 'أ',
      status: 'قيد_الشراء'
    });

    const savedVisa = await visa.save();

    // تحديث تأشيرات السكرتيرة النشطة
    secretary.activeVisas.push(savedVisa._id);
    await secretary.save();

    res.status(201).json(savedVisa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// تحديث المرحلة أ
router.put('/:id/stage-a', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.currentStage !== 'أ') {
      return res.status(400).json({ message: 'التأشيرة ليست في المرحلة أ' });
    }

    // تحديث حقول المرحلة أ
    Object.assign(visa, req.body);
    visa.stageACompleted = true;
    visa.currentStage = 'ب';
    visa.updatedAt = Date.now();

    const updatedVisa = await visa.save();
    res.json(updatedVisa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إضافة مصروف لأي مرحلة
router.post('/:id/expenses', async (req, res) => {
  try {
    const { amount, description, stage, date } = req.body;

    // Validate input
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'قيمة المصروف غير صحيحة أو مفقودة.' });
    }
    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'الوصف مطلوب.' });
    }
    const validStages = ['أ', 'ب', 'ج', 'د', 'استبدال'];
    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({ message: 'مرحلة غير صحيحة أو مفقودة.' });
    }
    if (date && isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: 'تاريخ المصروف غير صحيح.' });
    }

    const visa = await Visa.findById(req.params.id);
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    let expenseDate = date ? new Date(date) : new Date();

    const expense = {
      amount: parseFloat(amount),
      description,
      date: expenseDate,
      stage
    };

    // إضافة المصروف للمرحلة المناسبة
    switch (stage) {
      case 'أ':
        visa.stageAExpenses.push(expense);
        break;
      case 'ب':
        visa.stageBExpenses.push(expense);
        break;
      case 'ج':
        visa.stageCExpenses.push(expense);
        break;
      case 'د':
        visa.stageDExpenses.push(expense);
        break;
      case 'استبدال':
        visa.replacementExpenses.push(expense);
        break;
      default:
        return res.status(400).json({ message: 'مرحلة غير صحيحة' });
    }

    // إعادة حساب إجمالي المصروفات
    visa.calculateTotalExpenses();
    await visa.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إكمال المرحلة ب
router.put('/:id/complete-stage-b', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.currentStage !== 'ب') {
      return res.status(400).json({ message: 'التأشيرة ليست في المرحلة ب' });
    }

    // Allow completion even without expenses (skippable stage)
    visa.stageBCompleted = true;
    visa.currentStage = 'ج';
    await visa.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إكمال المرحلة ج
router.put('/:id/complete-stage-c', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.currentStage !== 'ج') {
      return res.status(400).json({ message: 'التأشيرة ليست في المرحلة ج' });
    }

    // Allow completion even without expenses (skippable stage)
    visa.stageCCompleted = true;
    visa.currentStage = 'د';
    await visa.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إكمال المرحلة د وتحويل لقسم البيع
router.put('/:id/complete-stage-d', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.currentStage !== 'د') {
      return res.status(400).json({ message: 'التأشيرة ليست في المرحلة د' });
    }

    // التحقق من تجاوز الموعد النهائي
    if (visa.isOverdue()) {
      return res.status(400).json({ message: 'انتهت مهلة التأشيرة' });
    }

    visa.stageDCompleted = true;
    visa.currentStage = 'مكتملة';
    visa.status = 'معروضة_للبيع';
    visa.completedAt = new Date();
    await visa.save();

    // تحديث قوائم تأشيرات السكرتيرة
    const secretary = await Secretary.findById(visa.secretary);
    secretary.activeVisas = secretary.activeVisas.filter(id => id.toString() !== visa._id.toString());
    secretary.completedVisas.push(visa._id);
    await secretary.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// بيع التأشيرة
router.put('/:id/sell', async (req, res) => {
  try {
    const { sellingPrice, customerName, customerPhone, sellingSecretary, sellingCommission } = req.body;
    const visa = await Visa.findById(req.params.id);
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.status !== 'معروضة_للبيع') {
      return res.status(400).json({ message: 'التأشيرة غير متاحة للبيع' });
    }

    visa.sellingPrice = parseFloat(sellingPrice);
    visa.customerName = customerName;
    visa.customerPhone = customerPhone;
    
    // إضافة معلومات عمولة البيع إذا تم توفيرها
    if (sellingSecretary && sellingCommission) {
      visa.sellingSecretary = sellingSecretary;
      visa.sellingCommission = parseFloat(sellingCommission);
    }
    
    visa.status = 'مباعة';
    visa.soldAt = new Date();
    visa.currentStage = 'مباعة';

    // حساب الربح والأرباح
    visa.calculateTotalExpenses(); // إعادة حساب المصروفات لتشمل عمولة البيع
    visa.calculateProfit();
    visa.calculateSecretaryEarnings();
    await visa.save();

    // تحديث أرباح السكرتيرة المسؤولة عن الشراء
    const secretary = await Secretary.findById(visa.secretary);
    secretary.totalEarnings += visa.secretaryEarnings;
    secretary.completedVisas = secretary.completedVisas.filter(id => id.toString() !== visa._id.toString());
    await secretary.save();

    // تحديث أرباح السكرتيرة المسؤولة عن البيع (إذا وجدت)
    if (visa.sellingSecretary && visa.sellingCommission > 0) {
      const sellingSecretaryDoc = await Secretary.findById(visa.sellingSecretary);
      if (sellingSecretaryDoc) {
        sellingSecretaryDoc.totalEarnings += visa.sellingCommission;
        await sellingSecretaryDoc.save();
      }
    }

    // تحديث حساب الشركة
    const companyAccount = await Account.findOne({ type: 'شركة' });
    if (companyAccount) {
      companyAccount.totalProfit += visa.calculateCompanyProfit();
      companyAccount.totalVisasSold += 1;
      await companyAccount.save();
    }

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إلغاء التأشيرة
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const visa = await Visa.findById(req.params.id);
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.status === 'مباعة') {
      return res.status(400).json({ message: 'لا يمكن إلغاء التأشيرة المباعة' });
    }

    visa.status = 'ملغاة';
    visa.cancelledAt = new Date();
    visa.cancelledReason = reason;
    visa.currentStage = 'ملغاة';

    // إضافة إجمالي المصروفات كدين على السكرتيرة
    const secretary = await Secretary.findById(visa.secretary);
    secretary.totalDebt += visa.totalExpenses;
    
    // إزالة من القوائم النشطة/المكتملة وإضافة للملغاة
    secretary.activeVisas = secretary.activeVisas.filter(id => id.toString() !== visa._id.toString());
    secretary.completedVisas = secretary.completedVisas.filter(id => id.toString() !== visa._id.toString());
    secretary.cancelledVisas.push(visa._id);
    await secretary.save();

    await visa.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// استبدال التأشيرة
router.post('/:id/replace', upload.single('visaDocument'), async (req, res) => {
  try {
    const originalVisa = await Visa.findById(req.params.id);
    if (!originalVisa) {
      return res.status(404).json({ message: 'التأشيرة الأصلية غير موجودة' });
    }

    if (originalVisa.isReplaced) {
      return res.status(400).json({ message: 'تم استبدال التأشيرة بالفعل' });
    }

    // التحقق من قاعدة الـ 30 يوم
    const visaCreationDate = new Date(originalVisa.createdAt);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate - visaCreationDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 30) {
      return res.status(400).json({ 
        message: `لا يمكن استبدال التأشيرة بعد مرور 30 يوماً من إصدارها. تم إصدار التأشيرة منذ ${daysDifference} يوماً`,
        daysSinceCreation: daysDifference,
        maxAllowedDays: 30
      });
    }

    const {
      name, dateOfBirth, nationality, passportNumber, visaNumber,
      middlemanName, visaSponsor, visaIssueDate, visaExpiryDate, visaDeadline
    } = req.body;

    // إنشاء تأشيرة جديدة مع علامة الاستبدال
    const newVisa = new Visa({
      name,
      dateOfBirth: new Date(dateOfBirth),
      nationality,
      passportNumber,
      visaNumber,
      secretary: originalVisa.secretary,
      secretaryCode: originalVisa.secretaryCode,
      orderNumber: originalVisa.orderNumber,
      middlemanName,
      visaSponsor,
      visaIssueDate: new Date(visaIssueDate),
      visaExpiryDate: new Date(visaExpiryDate),
      visaDeadline: new Date(visaDeadline),
      visaDocument: req.file ? req.file.filename : null,
      secretaryProfitPercentage: originalVisa.secretaryProfitPercentage,
      currentStage: 'أ',
      status: 'قيد_الشراء',
      isReplaced: true,
      originalVisa: originalVisa._id,
      replacementDate: new Date()
    });

    const savedNewVisa = await newVisa.save();

    // تحديث التأشيرة الأصلية
    originalVisa.isReplaced = true;
    originalVisa.replacedVisa = savedNewVisa._id;
    originalVisa.replacementDate = new Date();
    await originalVisa.save();

    // تحديث تأشيرات السكرتيرة النشطة
    const secretary = await Secretary.findById(originalVisa.secretary);
    secretary.activeVisas.push(savedNewVisa._id);
    await secretary.save();

    res.status(201).json(savedNewVisa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// التحقق من إمكانية استبدال التأشيرة
router.get('/:id/replacement-eligibility', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    const visaCreationDate = new Date(visa.createdAt);
    const currentDate = new Date();
    const daysSinceCreation = Math.floor((currentDate - visaCreationDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, 30 - daysSinceCreation);
    
    const isEligible = !visa.isReplaced && 
                      visa.status !== 'مباعة' && 
                      visa.status !== 'ملغاة' && 
                      daysSinceCreation <= 30;

    res.json({
      eligible: isEligible,
      daysSinceCreation,
      remainingDays,
      maxAllowedDays: 30,
      isReplaced: visa.isReplaced,
      status: visa.status,
      createdAt: visa.createdAt,
      reasons: isEligible ? [] : [
        ...(visa.isReplaced ? ['تم استبدال التأشيرة بالفعل'] : []),
        ...(visa.status === 'مباعة' ? ['التأشيرة مباعة'] : []),
        ...(visa.status === 'ملغاة' ? ['التأشيرة ملغاة'] : []),
        ...(daysSinceCreation > 30 ? [`انتهت فترة الاستبدال (${daysSinceCreation} يوم)`] : [])
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// التحقق من وصول الخادمة وتفعيل الموعد النهائي
router.post('/:id/verify-arrival', async (req, res) => {
  try {
    const { arrivalDate, notes, verifiedBy } = req.body;
    
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    // التحقق من أهلية التحقق من الوصول
    if (!visa.isEligibleForArrivalVerification()) {
      return res.status(400).json({ 
        message: 'التأشيرة غير مؤهلة للتحقق من الوصول',
        currentStage: visa.currentStage,
        status: visa.status,
        alreadyVerified: visa.maidArrivalVerified
      });
    }

    // التحقق من صحة تاريخ الوصول
    const arrival = new Date(arrivalDate);
    const now = new Date();
    const visaCreation = new Date(visa.createdAt);

    if (arrival > now) {
      return res.status(400).json({ message: 'تاريخ الوصول لا يمكن أن يكون في المستقبل' });
    }

    if (arrival < visaCreation) {
      return res.status(400).json({ message: 'تاريخ الوصول لا يمكن أن يكون قبل إنشاء التأشيرة' });
    }

    // تحديث معلومات الوصول
    visa.maidArrivalVerified = true;
    visa.maidArrivalDate = arrival;
    visa.maidArrivalVerifiedBy = verifiedBy;
    visa.maidArrivalNotes = notes || '';
    
    // تحديث حالة الموعد النهائي
    visa.updateDeadlineStatus();
    
    // تحديث المرحلة والحالة إذا لزم الأمر
    if (visa.currentStage === 'د') {
      visa.currentStage = 'وصول';
      visa.status = 'معروضة_للبيع';
    }

    await visa.save();

    console.log(`✅ تم التحقق من وصول الخادمة للتأشيرة ${visa.visaNumber}`);
    console.log(`📅 تاريخ الوصول: ${arrival.toLocaleDateString('ar-SA')}`);
    console.log(`⏰ الموعد النهائي للإلغاء: ${visa.activeCancellationDeadline?.toLocaleDateString('ar-SA')}`);

    res.json({
      message: 'تم التحقق من وصول الخادمة بنجاح',
      visa: {
        _id: visa._id,
        visaNumber: visa.visaNumber,
        maidArrivalVerified: visa.maidArrivalVerified,
        maidArrivalDate: visa.maidArrivalDate,
        activeCancellationDeadline: visa.activeCancellationDeadline,
        deadlineStatus: visa.deadlineStatus,
        daysUntilCancellation: visa.getDaysUntilCancellation(),
        currentStage: visa.currentStage,
        status: visa.status
      }
    });
  } catch (error) {
    console.error('خطأ في التحقق من وصول الخادمة:', error);
    res.status(500).json({ message: error.message });
  }
});

// الحصول على حالة وصول الخادمة والموعد النهائي
router.get('/:id/arrival-status', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id)
      .populate('maidArrivalVerifiedBy', 'name code');
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    // تحديث حالة الموعد النهائي
    visa.updateDeadlineStatus();
    await visa.save();

    const arrivalStatus = {
      visaId: visa._id,
      visaNumber: visa.visaNumber,
      maidArrivalVerified: visa.maidArrivalVerified,
      maidArrivalDate: visa.maidArrivalDate,
      maidArrivalVerifiedBy: visa.maidArrivalVerifiedBy,
      maidArrivalNotes: visa.maidArrivalNotes,
      activeCancellationDeadline: visa.activeCancellationDeadline,
      deadlineStatus: visa.deadlineStatus,
      daysUntilCancellation: visa.getDaysUntilCancellation(),
      eligibleForArrivalVerification: visa.isEligibleForArrivalVerification(),
      currentStage: visa.currentStage,
      status: visa.status
    };

    if (visa.maidArrivalVerified && visa.maidArrivalDate) {
      const daysSinceArrival = Math.floor((new Date() - new Date(visa.maidArrivalDate)) / (1000 * 60 * 60 * 24));
      arrivalStatus.daysSinceArrival = daysSinceArrival;
    }

    res.json(arrivalStatus);
  } catch (error) {
    console.error('خطأ في جلب حالة الوصول:', error);
    res.status(500).json({ message: error.message });
  }
});

// الحصول على قائمة التأشيرات المؤهلة للتحقق من الوصول
router.get('/pending-arrival-verification', async (req, res) => {
  try {
    const visas = await Visa.find({
      currentStage: { $in: ['د', 'مكتملة'] },
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع'] },
      maidArrivalVerified: false
    })
    .populate('secretary', 'name code')
    .select('name visaNumber currentStage status secretary createdAt')
    .sort({ createdAt: -1 });

    console.log(`📋 Found ${visas.length} visas pending arrival verification`);

    res.json({
      visas,
      count: visas.length,
      message: `${visas.length} تأشيرة في انتظار التحقق من الوصول`
    });
  } catch (error) {
    console.error('خطأ في جلب التأشيرات المؤهلة للتحقق من الوصول:', error);
    res.status(500).json({ message: error.message });
  }
});

// فحص التأشيرات المتأخرة (نقطة نهاية للمهام المجدولة) - النظام الجديد
router.post('/check-overdue', async (req, res) => {
  try {
    // البحث عن التأشيرات التي وصلت الخادمة ولها موعد نهائي نشط منتهي
    const overdueVisas = await Visa.find({
      maidArrivalVerified: true,
      deadlineStatus: 'active',
      activeCancellationDeadline: { $lt: new Date() },
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع', 'في_انتظار_الوصول'] }
    });

    let cancelledCount = 0;
    for (const visa of overdueVisas) {
      visa.status = 'ملغاة';
      visa.cancelledAt = new Date();
      visa.cancelledReason = 'انتهاء الموعد النهائي بعد وصول الخادمة (30 يوماً)';
      visa.currentStage = 'ملغاة';
      visa.deadlineStatus = 'expired';
      await visa.save();
      cancelledCount++;

      // إضافة الدين على السكرتيرة
      const secretary = await Secretary.findById(visa.secretary);
      if (secretary) {
        secretary.totalDebt += visa.totalExpenses;
        secretary.activeVisas = secretary.activeVisas.filter(id => id.toString() !== visa._id.toString());
        secretary.completedVisas = secretary.completedVisas.filter(id => id.toString() !== visa._id.toString());
        secretary.cancelledVisas.push(visa._id);
        await secretary.save();
      }
      
      console.log(`❌ تم إلغاء التأشيرة ${visa.visaNumber} - انتهى الموعد النهائي بعد وصول الخادمة`);
    }

    // تحديث حالة المواعيد النهائية للتأشيرات النشطة
    const activeVisas = await Visa.find({
      maidArrivalVerified: true,
      deadlineStatus: 'active',
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع', 'في_انتظار_الوصول'] }
    });

    let updatedCount = 0;
    for (const visa of activeVisas) {
      const oldStatus = visa.deadlineStatus;
      visa.updateDeadlineStatus();
      if (oldStatus !== visa.deadlineStatus) {
        await visa.save();
        updatedCount++;
      }
    }

    console.log(`🔄 النظام الجديد: تم إلغاء ${cancelledCount} تأشيرة بعد انتهاء 30 يوماً من وصول الخادمة`);
    console.log(`📊 تم تحديث حالة ${updatedCount} تأشيرة`);
    
    res.json({ 
      message: `تم فحص التأشيرات المتأخرة وإلغاء ${cancelledCount} تأشيرة`,
      cancelledCount,
      updatedCount,
      note: 'النظام الجديد: الإلغاء يتم فقط بعد 30 يوماً من وصول الخادمة',
      explanation: 'التأشيرات التي لم تصل الخادمة بعد محمية من الإلغاء التلقائي'
    });
  } catch (error) {
    console.error('خطأ في فحص التأشيرات المتأخرة:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
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

// الحصول على جميع التأشيرات مع الفلترة
router.get('/', async (req, res) => {
  try {
    const { status, stage, secretary } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (stage) filter.currentStage = stage;
    if (secretary) filter.secretary = secretary;
    
    const visas = await Visa.find(filter)
      .populate('secretary', 'name code')
      .sort({ createdAt: -1 });
    
    res.json(visas);
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

    // الحصول على السكرتير
    const secretary = await Secretary.findById(secretaryId);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }

    // الحصول على الرقم التسلسلي التالي لهذا السكرتير
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

    // تحديث تأشيرات السكرتير النشطة
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
    const visa = await Visa.findById(req.params.id);
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    const expense = {
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
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

    visa.stageCCompleted = true;
    visa.currentStage = 'د';
    await visa.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إكمال المرحلة د
router.put('/:id/complete-stage-d', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.currentStage !== 'د') {
      return res.status(400).json({ message: 'التأشيرة ليست في المرحلة د' });
    }

    visa.stageDCompleted = true;
    visa.currentStage = 'هـ';
    await visa.save();

    res.json(visa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// إكمال عملية الشراء (المرحلة هـ)
router.put('/:id/complete-buying-process', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    if (visa.currentStage !== 'هـ') {
      return res.status(400).json({ message: 'التأشيرة ليست في المرحلة النهائية' });
    }

    // التحقق من تجاوز الموعد النهائي
    if (visa.isOverdue()) {
      return res.status(400).json({ message: 'انتهت مهلة التأشيرة' });
    }

    visa.stageECompleted = true;
    visa.currentStage = 'مكتملة';
    visa.status = 'معروضة_للبيع';
    visa.completedAt = new Date();
    await visa.save();

    // تحديث قوائم تأشيرات السكرتير
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
    const { sellingPrice, customerName, customerPhone } = req.body;
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
    visa.status = 'مباعة';
    visa.soldAt = new Date();
    visa.currentStage = 'مباعة';

    // حساب الربح والأرباح
    visa.calculateProfit();
    visa.calculateSecretaryEarnings();
    await visa.save();

    // تحديث أرباح السكرتير
    const secretary = await Secretary.findById(visa.secretary);
    secretary.totalEarnings += visa.secretaryEarnings;
    secretary.completedVisas = secretary.completedVisas.filter(id => id.toString() !== visa._id.toString());
    await secretary.save();

    // تحديث حساب الشركة
    const companyAccount = await Account.findOne({ type: 'شركة' });
    if (companyAccount) {
      companyAccount.totalProfit += (visa.profit - visa.secretaryEarnings);
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

    // إضافة إجمالي المصروفات كدين على السكرتير
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

    // تحديث تأشيرات السكرتير النشطة
    const secretary = await Secretary.findById(originalVisa.secretary);
    secretary.activeVisas.push(savedNewVisa._id);
    await secretary.save();

    res.status(201).json(savedNewVisa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// فحص التأشيرات المتأخرة (نقطة نهاية للمهام المجدولة)
router.post('/check-overdue', async (req, res) => {
  try {
    const overdueVisas = await Visa.find({
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع'] },
      visaDeadline: { $lt: new Date() }
    });

    for (const visa of overdueVisas) {
      visa.status = 'ملغاة';
      visa.cancelledAt = new Date();
      visa.cancelledReason = 'تجاوز الموعد النهائي - إلغاء تلقائي';
      visa.currentStage = 'ملغاة';
      await visa.save();

      // إضافة الدين على السكرتير
      const secretary = await Secretary.findById(visa.secretary);
      secretary.totalDebt += visa.totalExpenses;
      secretary.activeVisas = secretary.activeVisas.filter(id => id.toString() !== visa._id.toString());
      secretary.completedVisas = secretary.completedVisas.filter(id => id.toString() !== visa._id.toString());
      secretary.cancelledVisas.push(visa._id);
      await secretary.save();
    }

    res.json({ message: `تم إلغاء ${overdueVisas.length} تأشيرة متأخرة` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
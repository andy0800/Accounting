const express = require('express');
const router = express.Router();
const Secretary = require('../models/Secretary');
const Visa = require('../models/Visa');
const Account = require('../models/Account');

// الحصول على جميع السكرتارية
router.get('/', async (req, res) => {
  try {
    const secretaries = await Secretary.find().sort({ name: 1 });
    res.json(secretaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على سكرتيرة محددة مع المعلومات التفصيلية
router.get('/:id', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
    }

    // الحصول على جميع التأشيرات لهذه السكرتيرة
    const visas = await Visa.find({ secretary: req.params.id })
      .populate('secretary', 'name code')
      .sort({ createdAt: -1 });

    // حساب الإحصائيات
    const activeVisas = visas.filter(v => v.status === 'قيد_الشراء');
    const availableVisas = visas.filter(v => v.status === 'معروضة_للبيع');
    const soldVisas = visas.filter(v => v.status === 'مباعة');
    const cancelledVisas = visas.filter(v => v.status === 'ملغاة');

    const totalExpenses = visas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
    const totalEarnings = soldVisas.reduce((sum, visa) => sum + visa.secretaryEarnings, 0);
    const totalDebt = cancelledVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);

    const secretaryData = {
      ...secretary.toObject(),
      visas,
      statistics: {
        activeVisas: activeVisas.length,
        availableVisas: availableVisas.length,
        soldVisas: soldVisas.length,
        cancelledVisas: cancelledVisas.length,
        totalExpenses,
        totalEarnings,
        totalDebt
      }
    };

    res.json(secretaryData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إنشاء سكرتيرة جديدة
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // التحقق من وجود سكرتيرة بنفس الاسم
    const existingSecretary = await Secretary.findOne({ name });
    if (existingSecretary) {
      return res.status(400).json({ message: 'يوجد سكرتيرة بهذا الاسم بالفعل' });
    }

    const secretary = new Secretary({
      name,
      email,
      phone
    });

    const savedSecretary = await secretary.save();

    // إنشاء حساب للسكرتيرة
    const account = new Account({
      name: `حساب ${name}`,
      type: 'سكرتيرة',
      secretaryId: savedSecretary._id
    });
    await account.save();

    res.status(201).json(savedSecretary);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// تحديث السكرتيرة
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
    }

    secretary.name = name || secretary.name;
    secretary.email = email || secretary.email;
    secretary.phone = phone || secretary.phone;

    const updatedSecretary = await secretary.save();
    res.json(updatedSecretary);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// حذف السكرتير (فقط إذا لم يكن لديه تأشيرات نشطة)
router.delete('/:id', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }

    // التحقق من وجود تأشيرات نشطة
    const activeVisas = await Visa.find({ 
      secretary: req.params.id, 
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع'] } 
    });

    if (activeVisas.length > 0) {
      return res.status(400).json({ 
        message: 'لا يمكن حذف السكرتير لوجود تأشيرات نشطة' 
      });
    }

    await Secretary.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف السكرتير بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على إحصائيات السكرتير
router.get('/:id/statistics', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }

    const visas = await Visa.find({ secretary: req.params.id });
    
    const statistics = {
      totalVisas: visas.length,
      activeVisas: visas.filter(v => v.status === 'قيد_الشراء').length,
      availableVisas: visas.filter(v => v.status === 'معروضة_للبيع').length,
      soldVisas: visas.filter(v => v.status === 'مباعة').length,
      cancelledVisas: visas.filter(v => v.status === 'ملغاة').length,
      totalExpenses: visas.reduce((sum, v) => sum + v.totalExpenses, 0),
      totalEarnings: visas.filter(v => v.status === 'مباعة').reduce((sum, v) => sum + v.secretaryEarnings, 0),
      totalDebt: visas.filter(v => v.status === 'ملغاة').reduce((sum, v) => sum + v.totalExpenses, 0),
      averageProfitPerVisa: visas.filter(v => v.status === 'مباعة').length > 0 
        ? visas.filter(v => v.status === 'مباعة').reduce((sum, v) => sum + v.profit, 0) / visas.filter(v => v.status === 'مباعة').length 
        : 0
    };

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
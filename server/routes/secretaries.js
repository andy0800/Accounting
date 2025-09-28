const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

// الحصول على سكرتيرة محددة مع المعلومات التفصيلية (محسّن)
router.get('/:id', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
    }

    // حساب الإحصائيات باستخدام تجميع قاعدة البيانات (أسرع)
    const stats = await Visa.aggregate([
      { $match: { secretary: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalVisas: { $sum: 1 },
          totalExpenses: { $sum: "$totalExpenses" },
          activeVisas: {
            $sum: { $cond: [{ $eq: ["$status", "قيد_الشراء"] }, 1, 0] }
          },
          availableVisas: {
            $sum: { $cond: [{ $eq: ["$status", "معروضة_للبيع"] }, 1, 0] }
          },
          soldVisas: {
            $sum: { $cond: [{ $eq: ["$status", "مباعة"] }, 1, 0] }
          },
          cancelledVisas: {
            $sum: { $cond: [{ $eq: ["$status", "ملغاة"] }, 1, 0] }
          },
          totalEarnings: {
            $sum: {
              $cond: [
                { $eq: ["$status", "مباعة"] },
                "$secretaryEarnings",
                0
              ]
            }
          },
          totalDebt: {
            $sum: {
              $cond: [
                { $eq: ["$status", "ملغاة"] },
                "$totalExpenses",
                0
              ]
            }
          }
        }
      }
    ]);

    const statsData = stats[0] || {
      totalVisas: 0,
      totalExpenses: 0,
      activeVisas: 0,
      availableVisas: 0,
      soldVisas: 0,
      cancelledVisas: 0,
      totalEarnings: 0,
      totalDebt: 0
    };

    // جلب التأشيرات مع تحديد عدد النتائج لتحسين الأداء
    const visas = await Visa.find({ secretary: req.params.id })
      .populate('secretary', 'name code')
      .sort({ createdAt: -1 })
      .limit(50); // تحديد عدد النتائج لتحسين الأداء

    const secretaryData = {
      ...secretary.toObject(),
      visas,
      statistics: {
        activeVisas: statsData.activeVisas,
        availableVisas: statsData.availableVisas,
        soldVisas: statsData.soldVisas,
        cancelledVisas: statsData.cancelledVisas,
        totalExpenses: statsData.totalExpenses,
        totalEarnings: statsData.totalEarnings,
        totalDebt: statsData.totalDebt
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
    try {
      const account = new Account({
        name: `حساب ${name}`,
        type: 'سكرتيرة',
        secretaryId: savedSecretary._id
      });
      
      await account.save();
    } catch (accountError) {
      console.error('Error creating account:', accountError);
      // If account creation fails, we should still return the secretary
      // but log the account error
    }

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

// حذف السكرتيرة (فقط إذا لم تكن لديها تأشيرات نشطة)
router.delete('/:id', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
    }

    // التحقق من وجود تأشيرات نشطة
    const activeVisas = await Visa.find({ 
      secretary: req.params.id, 
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع'] } 
    });

    if (activeVisas.length > 0) {
      return res.status(400).json({ 
        message: 'لا يمكن حذف السكرتيرة لوجود تأشيرات نشطة' 
      });
    }

    await Secretary.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف السكرتيرة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على إحصائيات السكرتيرة
router.get('/:id/statistics', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
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
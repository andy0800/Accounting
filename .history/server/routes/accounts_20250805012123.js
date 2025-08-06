const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Secretary = require('../models/Secretary');
const Visa = require('../models/Visa');

// الحصول على حساب الشركة (فرصتكم)
router.get('/company', async (req, res) => {
  try {
    let companyAccount = await Account.findOne({ type: 'شركة' });
    
    if (!companyAccount) {
      // إنشاء حساب الشركة إذا لم يكن موجوداً
      companyAccount = new Account({
        name: 'فرصتكم',
        type: 'شركة'
      });
      await companyAccount.save();
    }

    // حساب الإحصائيات الفورية
    const allVisas = await Visa.find();
    const soldVisas = allVisas.filter(v => v.status === 'مباعة');
    const cancelledVisas = allVisas.filter(v => v.status === 'ملغاة');
    const activeVisas = allVisas.filter(v => v.status === 'قيد_الشراء');
    const availableVisas = allVisas.filter(v => v.status === 'معروضة_للبيع');

    const totalExpenses = allVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
    const totalProfit = soldVisas.reduce((sum, visa) => sum + (visa.profit - visa.secretaryEarnings), 0);
    const totalVisasBought = allVisas.length;
    const totalVisasSold = soldVisas.length;
    const totalVisasCancelled = cancelledVisas.length;
    const totalActiveVisas = activeVisas.length + availableVisas.length;

    // حساب الإحصائيات الشهرية والسنوية
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const monthlyExpenses = allVisas
      .filter(v => new Date(v.createdAt).getFullYear() === currentYear && 
                   new Date(v.createdAt).getMonth() + 1 === currentMonth)
      .reduce((sum, visa) => sum + visa.totalExpenses, 0);

    const monthlyProfit = soldVisas
      .filter(v => new Date(v.soldAt).getFullYear() === currentYear && 
                   new Date(v.soldAt).getMonth() + 1 === currentMonth)
      .reduce((sum, visa) => sum + (visa.profit - visa.secretaryEarnings), 0);

    const yearlyExpenses = allVisas
      .filter(v => new Date(v.createdAt).getFullYear() === currentYear)
      .reduce((sum, visa) => sum + visa.totalExpenses, 0);

    const yearlyProfit = soldVisas
      .filter(v => new Date(v.soldAt).getFullYear() === currentYear)
      .reduce((sum, visa) => sum + (visa.profit - visa.secretaryEarnings), 0);

    const averageProfitPerVisa = totalVisasSold > 0 ? totalProfit / totalVisasSold : 0;

    const companyData = {
      ...companyAccount.toObject(),
      statistics: {
        totalExpenses,
        totalProfit,
        totalVisasBought,
        totalVisasSold,
        totalVisasCancelled,
        totalActiveVisas,
        averageProfitPerVisa,
        monthlyExpenses,
        monthlyProfit,
        yearlyExpenses,
        yearlyProfit
      }
    };

    res.json(companyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على جميع حسابات السكرتارية
router.get('/secretaries', async (req, res) => {
  try {
    const secretaries = await Secretary.find().sort({ name: 1 });
    const secretaryAccounts = [];

    for (const secretary of secretaries) {
      const account = await Account.findOne({ 
        type: 'سكرتيرة', 
        secretaryId: secretary._id 
      });

      if (!account) {
        // إنشاء الحساب إذا لم يكن موجوداً
        const newAccount = new Account({
          name: `حساب ${secretary.name}`,
          type: 'سكرتيرة',
          secretaryId: secretary._id
        });
        await newAccount.save();
        secretaryAccounts.push({
          secretary,
          account: newAccount
        });
      } else {
        secretaryAccounts.push({
          secretary,
          account
        });
      }
    }

    res.json(secretaryAccounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على حساب سكرتيرة محددة
router.get('/secretaries/:id', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
    }

    let account = await Account.findOne({ 
      type: 'سكرتيرة', 
      secretaryId: req.params.id 
    });

    if (!account) {
      account = new Account({
        name: `حساب ${secretary.name}`,
        type: 'سكرتيرة',
        secretaryId: req.params.id
      });
      await account.save();
    }

    // الحصول على جميع التأشيرات لهذه السكرتيرة
    const visas = await Visa.find({ secretary: req.params.id });
    const soldVisas = visas.filter(v => v.status === 'مباعة');
    const cancelledVisas = visas.filter(v => v.status === 'ملغاة');
    const activeVisas = visas.filter(v => v.status === 'قيد_الشراء');
    const availableVisas = visas.filter(v => v.status === 'معروضة_للبيع');

    // حساب الإحصائيات الفورية
    const totalExpenses = visas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
    const totalEarnings = soldVisas.reduce((sum, visa) => sum + visa.secretaryEarnings, 0);
    const totalDebt = cancelledVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
    const totalProfit = soldVisas.reduce((sum, visa) => sum + visa.profit, 0);

    // حساب الإحصائيات الشهرية والسنوية
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const monthlyExpenses = visas
      .filter(v => new Date(v.createdAt).getFullYear() === currentYear && 
                   new Date(v.createdAt).getMonth() + 1 === currentMonth)
      .reduce((sum, visa) => sum + visa.totalExpenses, 0);

    const monthlyEarnings = soldVisas
      .filter(v => new Date(v.soldAt).getFullYear() === currentYear && 
                   new Date(v.soldAt).getMonth() + 1 === currentMonth)
      .reduce((sum, visa) => sum + visa.secretaryEarnings, 0);

    const yearlyExpenses = visas
      .filter(v => new Date(v.createdAt).getFullYear() === currentYear)
      .reduce((sum, visa) => sum + visa.totalExpenses, 0);

    const yearlyEarnings = soldVisas
      .filter(v => new Date(v.soldAt).getFullYear() === currentYear)
      .reduce((sum, visa) => sum + visa.secretaryEarnings, 0);

    const averageProfitPerVisa = soldVisas.length > 0 ? totalProfit / soldVisas.length : 0;

    const secretaryAccountData = {
      secretary,
      account,
      statistics: {
        totalVisas: visas.length,
        activeVisas: activeVisas.length,
        availableVisas: availableVisas.length,
        soldVisas: soldVisas.length,
        cancelledVisas: cancelledVisas.length,
        totalExpenses,
        totalEarnings,
        totalDebt,
        totalProfit,
        averageProfitPerVisa,
        monthlyExpenses,
        monthlyEarnings,
        yearlyExpenses,
        yearlyEarnings
      },
      visas
    };

    res.json(secretaryAccountData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تحديث إحصائيات الحساب (يُستدعى عند تحديث التأشيرات)
router.put('/update-statistics', async (req, res) => {
  try {
    const { secretaryId } = req.body;

    if (secretaryId) {
      // تحديث حساب سكرتير محدد
      const secretary = await Secretary.findById(secretaryId);
      if (!secretary) {
        return res.status(404).json({ message: 'السكرتير غير موجود' });
      }

      const visas = await Visa.find({ secretary: secretaryId });
      const soldVisas = visas.filter(v => v.status === 'مباعة');
      const cancelledVisas = visas.filter(v => v.status === 'ملغاة');

      const totalExpenses = visas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
      const totalEarnings = soldVisas.reduce((sum, visa) => sum + visa.secretaryEarnings, 0);
      const totalDebt = cancelledVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);

      // تحديث السكرتير
      secretary.totalEarnings = totalEarnings;
      secretary.totalDebt = totalDebt;
      await secretary.save();

      // تحديث حساب السكرتير
      let account = await Account.findOne({ type: 'سكرتير', secretaryId });
      if (account) {
        account.totalExpenses = totalExpenses;
        account.totalEarnings = totalEarnings;
        account.totalDebt = totalDebt;
        account.totalVisasBought = visas.length;
        account.totalVisasSold = soldVisas.length;
        account.totalVisasCancelled = cancelledVisas.length;
        account.activeVisas = visas.filter(v => v.status === 'قيد_الشراء').length;
        await account.save();
      }
    } else {
      // تحديث حساب الشركة
      const allVisas = await Visa.find();
      const soldVisas = allVisas.filter(v => v.status === 'مباعة');
      const cancelledVisas = allVisas.filter(v => v.status === 'ملغاة');

      const totalExpenses = allVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
      const totalProfit = soldVisas.reduce((sum, visa) => sum + (visa.profit - visa.secretaryEarnings), 0);

      let companyAccount = await Account.findOne({ type: 'شركة' });
      if (companyAccount) {
        companyAccount.totalExpenses = totalExpenses;
        companyAccount.totalProfit = totalProfit;
        companyAccount.totalVisasBought = allVisas.length;
        companyAccount.totalVisasSold = soldVisas.length;
        companyAccount.totalVisasCancelled = cancelledVisas.length;
        companyAccount.activeVisas = allVisas.filter(v => 
          v.status === 'قيد_الشراء' || v.status === 'معروضة_للبيع'
        ).length;
        await companyAccount.save();
      }
    }

    res.json({ message: 'تم تحديث الإحصائيات بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// الحصول على ملخص مالي
router.get('/summary', async (req, res) => {
  try {
    const allVisas = await Visa.find();
    const secretaries = await Secretary.find();
    
    const soldVisas = allVisas.filter(v => v.status === 'مباعة');
    const cancelledVisas = allVisas.filter(v => v.status === 'ملغاة');
    const activeVisas = allVisas.filter(v => v.status === 'قيد_الشراء');
    const availableVisas = allVisas.filter(v => v.status === 'معروضة_للبيع');

    const totalExpenses = allVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
    const totalProfit = soldVisas.reduce((sum, visa) => sum + visa.profit, 0);
    const totalSecretaryEarnings = soldVisas.reduce((sum, visa) => sum + visa.secretaryEarnings, 0);
    const totalCompanyProfit = totalProfit - totalSecretaryEarnings;
    const totalSecretaryDebt = secretaries.reduce((sum, sec) => sum + sec.totalDebt, 0);

    const summary = {
      totalVisas: allVisas.length,
      activeVisas: activeVisas.length,
      availableVisas: availableVisas.length,
      soldVisas: soldVisas.length,
      cancelledVisas: cancelledVisas.length,
      totalExpenses,
      totalProfit,
      totalSecretaryEarnings,
      totalCompanyProfit,
      totalSecretaryDebt,
      averageProfitPerVisa: soldVisas.length > 0 ? totalProfit / soldVisas.length : 0,
      secretaryCount: secretaries.length
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
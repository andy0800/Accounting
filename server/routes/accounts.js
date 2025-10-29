const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Secretary = require('../models/Secretary');
const Visa = require('../models/Visa');

// In-memory cache for dashboard data (5 minutes TTL)
let dashboardCache = {
  data: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5 minutes
};

// Function to clear server-side cache
const clearServerCache = () => {
  dashboardCache.data = null;
  dashboardCache.timestamp = 0;
  console.log('🧹 Server-side dashboard cache cleared');
};

// الحصول على حساب الشركة (فرصتكم) - محسّن مع التخزين المؤقت
router.get('/company', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.TTL) {
      console.log('📦 Dashboard cache hit - serving cached data');
      return res.json(dashboardCache.data);
    }

    console.log('🔄 Dashboard cache miss - fetching fresh data');

    let companyAccount = await Account.findOne({ type: 'شركة' });
    
    if (!companyAccount) {
      // إنشاء حساب الشركة إذا لم يكن موجوداً
      companyAccount = new Account({
        name: 'فرصتكم',
        type: 'شركة'
      });
      await companyAccount.save();
    }

    // حساب الإحصائيات باستخدام تجميع قاعدة البيانات (أسرع بكثير)
    const stats = await Visa.aggregate([
      {
        $group: {
          _id: null,
          totalVisas: { $sum: 1 },
          totalExpenses: { $sum: "$totalExpenses" },
          soldVisas: {
            $sum: {
              $cond: [{ $eq: ["$status", "مباعة"] }, 1, 0]
            }
          },
          cancelledVisas: {
            $sum: {
              $cond: [{ $eq: ["$status", "ملغاة"] }, 1, 0]
            }
          },
          activeVisas: {
            $sum: {
              $cond: [{ $eq: ["$status", "قيد_الشراء"] }, 1, 0]
            }
          },
          availableVisas: {
            $sum: {
              $cond: [{ $eq: ["$status", "معروضة_للبيع"] }, 1, 0]
            }
          },
          totalProfit: {
            $sum: {
              $cond: [
                { $eq: ["$status", "مباعة"] },
                { $subtract: ["$profit", "$secretaryEarnings"] },
                0
              ]
            }
          },
          totalSecretaryEarnings: {
            $sum: {
              $cond: [
                { $eq: ["$status", "مباعة"] },
                "$secretaryEarnings",
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
      soldVisas: 0,
      cancelledVisas: 0,
      activeVisas: 0,
      availableVisas: 0,
      totalProfit: 0,
      totalSecretaryEarnings: 0
    };

    const totalVisasBought = statsData.totalVisas;
    const totalVisasSold = statsData.soldVisas;
    const totalVisasCancelled = statsData.cancelledVisas;
    const totalActiveVisas = statsData.activeVisas + statsData.availableVisas;
    const totalExpenses = statsData.totalExpenses;
    const totalProfit = statsData.totalProfit;
    const totalSecretaryEarnings = statsData.totalSecretaryEarnings;
    
    // جلب تفاصيل التأشيرات المباعة فقط (محدود جداً لتحسين الأداء)
    const soldVisasDetails = await Visa.find({ status: 'مباعة' })
      .populate('secretary', 'name code')
      .select('_id secretaryCode orderNumber name secretary sellingPrice totalExpenses profit secretaryEarnings soldAt')
      .sort({ soldAt: -1 }) // أحدث المبيعات أولاً
      .limit(20); // تقليل العدد من 50 إلى 20 لتحسين الأداء

    // حساب ربح الشركة لكل تأشيرة مباعة
    const companyProfitPerVisa = soldVisasDetails.map(visa => ({
      visaId: visa._id,
      reference: `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`,
      name: visa.name,
      secretary: {
        _id: visa.secretary._id,
        name: visa.secretary.name,
        code: visa.secretary.code
      },
      sellingPrice: visa.sellingPrice,
      totalExpenses: visa.totalExpenses,
      profit: visa.profit,
      secretaryEarnings: visa.secretaryEarnings,
      companyProfit: visa.profit - visa.secretaryEarnings,
      soldAt: visa.soldAt
    }));

        // جلب عينة من التأشيرات للعرض (تحسين الأداء بشكل كبير)
        const allBoughtVisasData = await Visa.find()
          .populate('secretary', 'name code')
          .select('_id secretaryCode orderNumber name secretary status totalExpenses profit secretaryEarnings createdAt')
          .sort({ createdAt: -1 }) // أحدث التأشيرات أولاً
          .limit(30); // تقليل العدد من 100 إلى 30 لتحسين الأداء

    // تفاصيل جميع التأشيرات المشتراة مع ربح الشركة لكل منها
    const allBoughtVisas = allBoughtVisasData.map(visa => {
      let companyProfit = 0;
      let status = '';

      // حساب ربح الشركة حسب حالة التأشيرة
      switch (visa.status) {
        case 'مباعة':
          companyProfit = visa.profit - visa.secretaryEarnings;
          status = 'مباعة';
          break;
        case 'ملغاة':
          companyProfit = -visa.totalExpenses; // خسارة كاملة
          status = 'ملغاة';
          break;
        case 'قيد_الشراء':
          companyProfit = -visa.totalExpenses; // خسارة مؤقتة
          status = 'قيد الشراء';
          break;
        case 'معروضة_للبيع':
          companyProfit = -visa.totalExpenses; // خسارة مؤقتة
          status = 'معروضة للبيع';
          break;
        default:
          companyProfit = -visa.totalExpenses;
          status = visa.status;
      }

      return {
        visaId: visa._id,
        reference: `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`,
        name: visa.name,
        secretary: {
          _id: visa.secretary._id,
          name: visa.secretary.name,
          code: visa.secretary.code
        },
        status: status,
        currentStage: visa.currentStage,
        totalExpenses: visa.totalExpenses,
        sellingPrice: visa.sellingPrice || 0,
        profit: visa.profit || 0,
        secretaryEarnings: visa.secretaryEarnings || 0,
        companyProfit: companyProfit,
        createdAt: visa.createdAt,
        soldAt: visa.soldAt,
        visaDeadline: visa.visaDeadline,
        customerName: visa.customerName || '',
        customerPhone: visa.customerPhone || '',
        sellingSecretary: visa.sellingSecretary || null,
        sellingCommission: visa.sellingCommission || 0
      };
    });

    // حساب الإحصائيات الشهرية والسنوية باستخدام تجميع قاعدة البيانات
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const monthlyStats = await Visa.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: "$createdAt" }, currentYear] },
              { $eq: [{ $month: "$createdAt" }, currentMonth] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          monthlyExpenses: { $sum: "$totalExpenses" },
          monthlySoldProfit: {
            $sum: {
              $cond: [
                { $eq: ["$status", "مباعة"] },
                { $subtract: ["$profit", "$secretaryEarnings"] },
                0
              ]
            }
          }
        }
      }
    ]);

    const yearlyStats = await Visa.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $year: "$createdAt" }, currentYear] }
        }
      },
      {
        $group: {
          _id: null,
          yearlyExpenses: { $sum: "$totalExpenses" }
        }
      }
    ]);

    const monthlyData = monthlyStats[0] || { monthlyExpenses: 0, monthlySoldProfit: 0 };
    const yearlyData = yearlyStats[0] || { yearlyExpenses: 0 };

    const monthlyExpenses = monthlyData.monthlyExpenses;
    const monthlyProfit = monthlyData.monthlySoldProfit;
    const yearlyExpenses = yearlyData.yearlyExpenses;

    // حساب الربح السنوي للتأشيرات المباعة
    const yearlyProfitStats = await Visa.aggregate([
      {
        $match: {
          status: 'مباعة',
          $expr: { $eq: [{ $year: "$soldAt" }, currentYear] }
        }
      },
      {
        $group: {
          _id: null,
          yearlyProfit: {
            $sum: { $subtract: ["$profit", "$secretaryEarnings"] }
          }
        }
      }
    ]);

    const yearlyProfit = yearlyProfitStats[0]?.yearlyProfit || 0;

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
            yearlyProfit,
            companyProfitPerVisa,
            allBoughtVisas
          }
        };

        // Cache the result for 5 minutes
        dashboardCache.data = companyData;
        dashboardCache.timestamp = Date.now();
        console.log('💾 Dashboard data cached successfully');

        res.json(companyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// نقطة نهاية محسّنة للوحة التحكم - بيانات أساسية فقط
router.get('/summary', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.TTL) {
      console.log('📦 Dashboard summary cache hit');
      const summary = {
        totalVisas: dashboardCache.data.statistics.totalVisasBought,
        activeVisas: dashboardCache.data.statistics.totalActiveVisas,
        availableVisas: dashboardCache.data.statistics.availableVisas || 0,
        soldVisas: dashboardCache.data.statistics.totalVisasSold,
        cancelledVisas: dashboardCache.data.statistics.totalVisasCancelled,
        totalExpenses: dashboardCache.data.statistics.totalExpenses,
        totalProfit: dashboardCache.data.statistics.totalProfit,
        totalSecretaryEarnings: dashboardCache.data.statistics.totalSecretaryEarnings || 0,
        totalCompanyProfit: dashboardCache.data.statistics.totalProfit,
        totalSecretaryDebt: 0,
        secretaryCount: await Secretary.countDocuments(),
        overdueVisas: 0
      };
      return res.json(summary);
    }

    // Fast aggregation for dashboard summary only
    const [stats, secretaryCount] = await Promise.all([
      Visa.aggregate([
        {
          $group: {
            _id: null,
            totalVisas: { $sum: 1 },
            totalExpenses: { $sum: "$totalExpenses" },
            soldVisas: { $sum: { $cond: [{ $eq: ["$status", "مباعة"] }, 1, 0] } },
            cancelledVisas: { $sum: { $cond: [{ $eq: ["$status", "ملغاة"] }, 1, 0] } },
            activeVisas: { $sum: { $cond: [{ $eq: ["$status", "قيد_الشراء"] }, 1, 0] } },
            availableVisas: { $sum: { $cond: [{ $eq: ["$status", "معروضة_للبيع"] }, 1, 0] } },
            totalProfit: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "مباعة"] },
                  { $subtract: ["$profit", "$secretaryEarnings"] },
                  0
                ]
              }
            },
            totalSecretaryEarnings: {
              $sum: {
                $cond: [{ $eq: ["$status", "مباعة"] }, "$secretaryEarnings", 0]
              }
            }
          }
        }
      ]),
      Secretary.countDocuments()
    ]);

    const statsData = stats[0] || {
      totalVisas: 0,
      totalExpenses: 0,
      soldVisas: 0,
      cancelledVisas: 0,
      activeVisas: 0,
      availableVisas: 0,
      totalProfit: 0,
      totalSecretaryEarnings: 0
    };

    const summary = {
      totalVisas: statsData.totalVisas,
      activeVisas: statsData.activeVisas,
      availableVisas: statsData.availableVisas,
      soldVisas: statsData.soldVisas,
      cancelledVisas: statsData.cancelledVisas,
      totalExpenses: statsData.totalExpenses,
      totalProfit: statsData.totalProfit,
      totalSecretaryEarnings: statsData.totalSecretaryEarnings,
      totalCompanyProfit: statsData.totalProfit,
      totalSecretaryDebt: 0,
      secretaryCount: secretaryCount,
      overdueVisas: 0
    };

    console.log('⚡ Dashboard summary generated in fast mode');
    res.json(summary);
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
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
      }

      // الحصول على جميع التأشيرات لهذه السكرتيرة
      const visas = await Visa.find({ secretary: secretary._id });
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

      secretaryAccounts.push({
        secretary,
        account: account || newAccount,
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
      });
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
      // تحديث حساب سكرتيرة محددة
      const secretary = await Secretary.findById(secretaryId);
      if (!secretary) {
        return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
      }

      const visas = await Visa.find({ secretary: secretaryId });
      const soldVisas = visas.filter(v => v.status === 'مباعة');
      const cancelledVisas = visas.filter(v => v.status === 'ملغاة');

      const totalExpenses = visas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
      const totalEarnings = soldVisas.reduce((sum, visa) => sum + visa.secretaryEarnings, 0);
      const totalDebt = cancelledVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);

      // تحديث السكرتيرة
      secretary.totalEarnings = totalEarnings;
      secretary.totalDebt = totalDebt;
      await secretary.save();

      // تحديث حساب السكرتيرة
      let account = await Account.findOne({ type: 'سكرتيرة', secretaryId });
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

// Clear server-side cache endpoint
router.post('/clear-cache', async (req, res) => {
  try {
    clearServerCache();
    
    res.json({
      success: true,
      message: 'Server-side cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Cache clearing request completed');
  } catch (error) {
    console.error('❌ Error clearing server cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear server cache',
      error: error.message
    });
  }
});

// Get cache status endpoint
router.get('/cache-status', async (req, res) => {
  try {
    const status = {
      dashboardCache: {
        hasData: !!dashboardCache.data,
        timestamp: dashboardCache.timestamp,
        age: dashboardCache.timestamp ? Date.now() - dashboardCache.timestamp : 0,
        ttl: dashboardCache.TTL,
        expired: dashboardCache.timestamp ? (Date.now() - dashboardCache.timestamp) > dashboardCache.TTL : true
      },
      serverTime: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    console.error('❌ Error getting cache status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache status',
      error: error.message
    });
  }
});

module.exports = router; 
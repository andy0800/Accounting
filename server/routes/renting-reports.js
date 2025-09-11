const express = require('express');
const router = express.Router();
const RentalContract = require('../models/RentalContract');
const RentalPayment = require('../models/RentalPayment');
const RentalUnit = require('../models/RentalUnit');
const RentingSecretary = require('../models/RentingSecretary');

// Get rental dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentMonthYear = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // Get all active contracts
    const activeContracts = await RentalContract.find({ status: 'نشط' })
      .populate([
        { path: 'unitId', select: 'unitNumber unitType address' },
        { path: 'secretaryId', select: 'name phone email' }
      ]);
    
    // Get all terminated contracts
    const terminatedContracts = await RentalContract.find({ status: 'منتهي' })
      .populate([
        { path: 'unitId', select: 'unitNumber unitType address' },
        { path: 'secretaryId', select: 'name phone email' }
      ]);
    
    // Get current month payments
    const currentMonthPayments = await RentalPayment.find({ monthYear: currentMonthYear });
    
    // Get all secretaries
    const secretaries = await RentingSecretary.find();
    
    // Get all units
    const units = await RentalUnit.find();
    
    // Calculate current month statistics
    let currentMonthExpected = 0;
    let currentMonthCollected = 0;
    let currentMonthOutstanding = 0;
    let fullyPaidContracts = 0;
    let partiallyPaidContracts = 0;
    let unpaidContracts = 0;
    
    for (const contract of activeContracts) {
      currentMonthExpected += contract.monthlyRent;
      
      const contractPayments = currentMonthPayments.filter(
        payment => payment.contractId.toString() === contract._id.toString()
      );
      
      const totalPaid = contractPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = Math.max(0, contract.monthlyRent - totalPaid);
      
      currentMonthCollected += totalPaid;
      currentMonthOutstanding += remaining;
      
      if (totalPaid >= contract.monthlyRent) {
        fullyPaidContracts++;
      } else if (totalPaid > 0) {
        partiallyPaidContracts++;
      } else {
        unpaidContracts++;
      }
    }
    
    // Calculate overall statistics
    const totalMonthlyRent = activeContracts.reduce((sum, contract) => sum + contract.monthlyRent, 0);
    const totalUnits = units.length;
    const totalSecretaries = secretaries.length;
    const totalActiveContracts = activeContracts.length;
    const totalTerminatedContracts = terminatedContracts.length;
    
    // Get recent payments (last 10)
    const recentPayments = await RentalPayment.find()
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate({
        path: 'contractId',
        select: 'unitId secretaryId monthlyRent',
        populate: [
          { path: 'unitId', select: 'unitNumber unitType' },
          { path: 'secretaryId', select: 'name' }
        ]
      });
    
    // Get upcoming due dates (next 7 days)
    const upcomingDueDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfMonth = date.getDate();
      
      const contractsDue = activeContracts.filter(contract => contract.dueDay === dayOfMonth);
      if (contractsDue.length > 0) {
        upcomingDueDates.push({
          date: date.toISOString().split('T')[0],
          dayOfMonth,
          contracts: contractsDue.length,
          totalAmount: contractsDue.reduce((sum, contract) => sum + contract.monthlyRent, 0)
        });
      }
    }
    
    const dashboard = {
      currentMonth: {
        monthYear: currentMonthYear,
        period: `${currentYear} - ${currentMonth}`,
        expected: currentMonthExpected,
        collected: currentMonthCollected,
        outstanding: currentMonthOutstanding,
        collectionRate: currentMonthExpected > 0 ? 
          (currentMonthCollected / currentMonthExpected * 100).toFixed(2) : 0,
        contracts: {
          total: activeContracts.length,
          fullyPaid: fullyPaidContracts,
          partiallyPaid: partiallyPaidContracts,
          unpaid: unpaidContracts
        }
      },
      overview: {
        totalUnits,
        totalSecretaries,
        totalActiveContracts,
        totalTerminatedContracts,
        totalMonthlyRent
      },
      recentPayments: recentPayments.map(payment => ({
        id: payment._id,
        amount: payment.amount,
        date: payment.paymentDate,
        method: payment.paymentMethod,
        contract: {
          unit: payment.contractId.unitId,
          secretary: payment.contractId.secretaryId,
          monthlyRent: payment.contractId.monthlyRent
        }
      })),
      upcomingDueDates,
      topSecretaries: secretaries.slice(0, 5).map(secretary => ({
        id: secretary._id,
        name: secretary.name,
        phone: secretary.phone,
        email: secretary.email
      })),
      topUnits: units.slice(0, 5).map(unit => ({
        id: unit._id,
        unitNumber: unit.unitNumber,
        unitType: unit.unitType,
        address: unit.address
      }))
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get monthly rental report
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const monthYear = `${year}-${month.padStart(2, '0')}`;
    
    // Get all active contracts for this month
    const activeContracts = await RentalContract.find({ 
      status: 'نشط',
      startDate: { $lte: new Date(year, month - 1, 1) }
    }).populate([
      { path: 'unitId', select: 'unitNumber unitType address' },
      { path: 'secretaryId', select: 'name phone email' }
    ]);
    
    const report = {
      monthYear,
      period: `${year} - ${month}`,
      totalContracts: activeContracts.length,
      totalExpected: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      contracts: []
    };
    
    for (const contract of activeContracts) {
      // Get payments for this month
      const payments = await RentalPayment.find({ 
        contractId: contract._id, 
        monthYear 
      });
      
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = Math.max(0, contract.monthlyRent - totalPaid);
      const isFullyPaid = totalPaid >= contract.monthlyRent;
      const isPartiallyPaid = totalPaid > 0 && !isFullyPaid;
      
      report.totalExpected += contract.monthlyRent;
      report.totalCollected += totalPaid;
      report.totalOutstanding += remaining;
      
      report.contracts.push({
        contractId: contract._id,
        unit: contract.unitId,
        secretary: contract.secretaryId,
        monthlyRent: contract.monthlyRent,
        dueDay: contract.dueDay,
        totalPaid,
        remaining,
        isFullyPaid,
        isPartiallyPaid,
        paymentStatus: isFullyPaid ? 'مدفوع' : isPartiallyPaid ? 'مدفوع جزئياً' : 'غير مدفوع',
        payments: payments.map(p => ({
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          isPartial: p.isPartial
        }))
      });
    }
    
    // Calculate collection rate
    report.collectionRate = report.totalExpected > 0 ? 
      (report.totalCollected / report.totalExpected * 100).toFixed(2) : 0;
    
    // Group by status
    report.summary = {
      fullyPaid: report.contracts.filter(c => c.isFullyPaid).length,
      partiallyPaid: report.contracts.filter(c => c.isPartiallyPaid).length,
      unpaid: report.contracts.filter(c => !c.isPartiallyPaid && !c.isFullyPaid).length
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get quarterly rental report
router.get('/quarterly/:year/:quarter', async (req, res) => {
  try {
    const { year, quarter } = req.params;
    const quarterNum = parseInt(quarter);
    
    if (quarterNum < 1 || quarterNum > 4) {
      return res.status(400).json({ message: 'الربع يجب أن يكون بين 1 و 4' });
    }
    
    // Calculate months for this quarter
    const startMonth = (quarterNum - 1) * 3 + 1;
    const months = [
      `${year}-${startMonth.toString().padStart(2, '0')}`,
      `${year}-${(startMonth + 1).toString().padStart(2, '0')}`,
      `${year}-${(startMonth + 2).toString().padStart(2, '0')}`
    ];
    
    const report = {
      year,
      quarter: quarterNum,
      period: `الربع ${quarterNum} - ${year}`,
      months,
      totalContracts: 0,
      totalExpected: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      monthlyBreakdown: {},
      contracts: []
    };
    
    // Get all active contracts
    const activeContracts = await RentalContract.find({ 
      status: 'نشط',
      startDate: { $lte: new Date(year, startMonth + 2, 1) }
    }).populate([
      { path: 'unitId', select: 'unitNumber unitType address' },
      { path: 'secretaryId', select: 'name phone email' }
    ]);
    
    report.totalContracts = activeContracts.length;
    
    // Process each month
    for (const monthYear of months) {
      report.monthlyBreakdown[monthYear] = {
        monthYear,
        expected: 0,
        collected: 0,
        outstanding: 0,
        contracts: []
      };
      
      for (const contract of activeContracts) {
        // Check if contract was active in this month
        const contractStart = new Date(contract.startDate);
        const monthDate = new Date(monthYear + '-01');
        if (contractStart > monthDate) continue;
        
        // Get payments for this month
        const payments = await RentalPayment.find({ 
          contractId: contract._id, 
          monthYear 
        });
        
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remaining = Math.max(0, contract.monthlyRent - totalPaid);
        
        report.monthlyBreakdown[monthYear].expected += contract.monthlyRent;
        report.monthlyBreakdown[monthYear].collected += totalPaid;
        report.monthlyBreakdown[monthYear].outstanding += remaining;
        
        report.totalExpected += contract.monthlyRent;
        report.totalCollected += totalPaid;
        report.totalOutstanding += remaining;
        
        // Add to monthly breakdown
        report.monthlyBreakdown[monthYear].contracts.push({
          contractId: contract._id,
          unit: contract.unitId,
          secretary: contract.secretaryId,
          monthlyRent: contract.monthlyRent,
          totalPaid,
          remaining,
          paymentStatus: totalPaid >= contract.monthlyRent ? 'مدفوع' : 
                        totalPaid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'
        });
      }
    }
    
    // Calculate collection rate
    report.collectionRate = report.totalExpected > 0 ? 
      (report.totalCollected / report.totalExpected * 100).toFixed(2) : 0;
    
    // Overall summary
    report.summary = {
      totalMonths: months.length,
      averageMonthlyCollection: report.totalExpected > 0 ? 
        (report.totalCollected / months.length).toFixed(2) : 0,
      averageMonthlyOutstanding: report.totalExpected > 0 ? 
        (report.totalOutstanding / months.length).toFixed(2) : 0
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating quarterly report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get annual rental report
router.get('/annual/:year', async (req, res) => {
  try {
    const { year } = req.params;
    
    const report = {
      year: parseInt(year),
      period: `السنة ${year}`,
      totalContracts: 0,
      totalExpected: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      monthlyBreakdown: {},
      quarterlyBreakdown: {},
      contracts: []
    };
    
    // Get all active contracts for this year
    const activeContracts = await RentalContract.find({ 
      status: 'نشط',
      startDate: { $lte: new Date(year, 11, 31) }
    }).populate([
      { path: 'unitId', select: 'unitNumber unitType address' },
      { path: 'secretaryId', select: 'name phone email' }
    ]);
    
    report.totalContracts = activeContracts.length;
    
    // Process each month
    for (let month = 1; month <= 12; month++) {
      const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
      
      report.monthlyBreakdown[monthYear] = {
        monthYear,
        month: month,
        expected: 0,
        collected: 0,
        outstanding: 0,
        contracts: []
      };
      
      for (const contract of activeContracts) {
        // Check if contract was active in this month
        const contractStart = new Date(contract.startDate);
        const monthDate = new Date(year, month - 1, 1);
        if (contractStart > monthDate) continue;
        
        // Get payments for this month
        const payments = await RentalPayment.find({ 
          contractId: contract._id, 
          monthYear 
        });
        
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remaining = Math.max(0, contract.monthlyRent - totalPaid);
        
        report.monthlyBreakdown[monthYear].expected += contract.monthlyRent;
        report.monthlyBreakdown[monthYear].collected += totalPaid;
        report.monthlyBreakdown[monthYear].outstanding += remaining;
        
        report.totalExpected += contract.monthlyRent;
        report.totalCollected += totalPaid;
        report.totalOutstanding += remaining;
        
        // Add to monthly breakdown
        report.monthlyBreakdown[monthYear].contracts.push({
          contractId: contract._id,
          unit: contract.unitId,
          secretary: contract.secretaryId,
          monthlyRent: contract.monthlyRent,
          totalPaid,
          remaining,
          paymentStatus: totalPaid >= contract.monthlyRent ? 'مدفوع' : 
                        totalPaid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'
        });
      }
    }
    
    // Calculate quarterly breakdown
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startMonth = (quarter - 1) * 3 + 1;
      const months = [
        `${year}-${startMonth.toString().padStart(2, '0')}`,
        `${year}-${(startMonth + 1).toString().padStart(2, '0')}`,
        `${year}-${(startMonth + 2).toString().padStart(2, '0')}`
      ];
      
      let quarterExpected = 0;
      let quarterCollected = 0;
      let quarterOutstanding = 0;
      
      months.forEach(monthYear => {
        if (report.monthlyBreakdown[monthYear]) {
          quarterExpected += report.monthlyBreakdown[monthYear].expected;
          quarterCollected += report.monthlyBreakdown[monthYear].collected;
          quarterOutstanding += report.monthlyBreakdown[monthYear].outstanding;
        }
      });
      
      report.quarterlyBreakdown[quarter] = {
        quarter,
        expected: quarterExpected,
        collected: quarterCollected,
        outstanding: quarterOutstanding,
        collectionRate: quarterExpected > 0 ? 
          (quarterCollected / quarterExpected * 100).toFixed(2) : 0
      };
    }
    
    // Calculate collection rate
    report.collectionRate = report.totalExpected > 0 ? 
      (report.totalCollected / report.totalExpected * 100).toFixed(2) : 0;
    
    // Overall summary
    report.summary = {
      totalMonths: 12,
      averageMonthlyCollection: report.totalExpected > 0 ? 
        (report.totalCollected / 12).toFixed(2) : 0,
      averageMonthlyOutstanding: report.totalExpected > 0 ? 
        (report.totalOutstanding / 12).toFixed(2) : 0,
      bestMonth: Object.values(report.monthlyBreakdown)
        .reduce((best, month) => month.collected > best.collected ? month : best),
      worstMonth: Object.values(report.monthlyBreakdown)
        .reduce((worst, month) => month.outstanding > worst.outstanding ? month : worst)
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating annual report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get secretary performance report
router.get('/secretary/:secretaryId', async (req, res) => {
  try {
    const { secretaryId } = req.params;
    const { year, month } = req.query;
    
    // Get secretary details
    const secretary = await RentingSecretary.findById(secretaryId);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }
    
    // Get all contracts for this secretary
    const contracts = await RentalContract.find({ 
      secretaryId,
      status: 'نشط'
    }).populate('unitId', 'unitNumber unitType address');
    
    const report = {
      secretary: {
        id: secretary._id,
        name: secretary.name,
        phone: secretary.phone,
        email: secretary.email
      },
      contracts: contracts.length,
      totalExpected: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      contractDetails: []
    };
    
    for (const contract of contracts) {
      // Get payments for this contract
      let paymentsQuery = { contractId: contract._id };
      if (year && month) {
        paymentsQuery.monthYear = `${year}-${month.padStart(2, '0')}`;
      }
      
      const payments = await RentalPayment.find(paymentsQuery);
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = Math.max(0, contract.monthlyRent - totalPaid);
      
      report.totalExpected += contract.monthlyRent;
      report.totalCollected += totalPaid;
      report.totalOutstanding += remaining;
      
      report.contractDetails.push({
        contractId: contract._id,
        unit: contract.unitId,
        monthlyRent: contract.monthlyRent,
        startDate: contract.startDate,
        dueDay: contract.dueDay,
        totalPaid,
        remaining,
        paymentStatus: totalPaid >= contract.monthlyRent ? 'مدفوع' : 
                      totalPaid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع',
        payments: payments.length
      });
    }
    
    // Calculate performance metrics
    report.performance = {
      collectionRate: report.totalExpected > 0 ? 
        (report.totalCollected / report.totalExpected * 100).toFixed(2) : 0,
      averageContractValue: contracts.length > 0 ? 
        (report.totalExpected / contracts.length).toFixed(2) : 0,
      totalPayments: report.contractDetails.reduce((sum, contract) => sum + contract.payments, 0)
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating secretary report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get overdue payments report
router.get('/overdue', async (req, res) => {
  try {
    const { monthYear } = req.query;
    const targetMonth = monthYear || new Date().toISOString().slice(0, 7);
    
    // Get all active contracts
    const activeContracts = await RentalContract.find({ status: 'نشط' })
      .populate([
        { path: 'unitId', select: 'unitNumber unitType address' },
        { path: 'secretaryId', select: 'name phone email' }
      ]);
    
    const overdueReport = {
      monthYear: targetMonth,
      totalOverdue: 0,
      totalAmount: 0,
      contracts: []
    };
    
    for (const contract of activeContracts) {
      // Get payments for this month
      const payments = await RentalPayment.find({ 
        contractId: contract._id, 
        monthYear: targetMonth 
      });
      
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = Math.max(0, contract.monthlyRent - totalPaid);
      
      if (remaining > 0) {
        overdueReport.totalOverdue += 1;
        overdueReport.totalAmount += remaining;
        
        overdueReport.contracts.push({
          contractId: contract._id,
          unit: contract.unitId,
          secretary: contract.secretaryId,
          monthlyRent: contract.monthlyRent,
          totalPaid,
          remaining,
          dueDay: contract.dueDay,
          daysOverdue: Math.max(0, new Date().getDate() - contract.dueDay),
          paymentStatus: totalPaid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'
        });
      }
    }
    
    // Sort by days overdue (most overdue first)
    overdueReport.contracts.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    res.json(overdueReport);
  } catch (error) {
    console.error('Error generating overdue report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get payment methods summary
router.get('/payment-methods/:monthYear', async (req, res) => {
  try {
    const { monthYear } = req.params;
    
    const payments = await RentalPayment.find({ monthYear })
      .populate({
        path: 'contractId',
        select: 'unitId secretaryId',
        populate: [
          { path: 'unitId', select: 'unitNumber' },
          { path: 'secretaryId', select: 'name' }
        ]
      });
    
    const methodsSummary = {};
    let totalAmount = 0;
    
    payments.forEach(payment => {
      if (!methodsSummary[payment.paymentMethod]) {
        methodsSummary[payment.paymentMethod] = {
          method: payment.paymentMethod,
          count: 0,
          totalAmount: 0,
          payments: []
        };
      }
      
      methodsSummary[payment.paymentMethod].count += 1;
      methodsSummary[payment.paymentMethod].totalAmount += payment.amount;
      methodsSummary[payment.paymentMethod].payments.push({
        amount: payment.amount,
        date: payment.paymentDate,
        contract: payment.contractId
      });
      
      totalAmount += payment.amount;
    });
    
    // Convert to array and sort by amount
    const methodsArray = Object.values(methodsSummary)
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    res.json({
      monthYear,
      totalAmount,
      totalPayments: payments.length,
      methods: methodsArray,
      summary: methodsArray.map(method => ({
        method: method.method,
        count: method.count,
        totalAmount: method.totalAmount,
        percentage: totalAmount > 0 ? 
          (method.totalAmount / totalAmount * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    console.error('Error generating payment methods report:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

module.exports = router;

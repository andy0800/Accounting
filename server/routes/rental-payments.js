const express = require('express');
const dayjs = require('dayjs');
const RentalPayment = require('../models/RentalPayment');
const RentalContract = require('../models/RentalContract');
const RentalUnit = require('../models/RentalUnit');

const router = express.Router();

function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });
    const jwt = require('jsonwebtoken');
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'جلسة غير صالحة' });
  }
}

router.use(requireAuth);

function evaluateStatus(month, today = dayjs()) {
  if (month.remainingAmount <= 0) return 'Paid';
  if (month.totalPaid > 0) return today.isAfter(dayjs(month.dueDate)) ? 'Overdue' : 'Partially Paid';
  if (today.isAfter(dayjs(month.dueDate))) return 'Overdue';
  return 'Pending';
}

router.post('/', async (req, res) => {
  try {
    const {
      contractId,
      monthYear,
      amount,
      method,
      transactionRef,
      paymentDate,
      notes,
    } = req.body;

    if (!contractId || !monthYear || !amount || !method) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }

    const contract = await RentalContract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'العقد غير موجود' });

    const monthEntry = contract.months.find((m) => m.monthYear === monthYear);
    if (!monthEntry) {
      return res.status(400).json({ message: 'الشهر غير موجود في جدول العقد' });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'مبلغ غير صالح' });
    }

    const paymentDoc = new RentalPayment({
      contractId,
      monthYear,
      amount: numericAmount,
      method,
      transactionRef,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      enteredBy: req.user?.username,
    });

    const newTotal = monthEntry.totalPaid + numericAmount;
    monthEntry.totalPaid = newTotal;
    monthEntry.remainingAmount = Math.max(0, monthEntry.dueAmount - newTotal);
    monthEntry.status = evaluateStatus(monthEntry);
    monthEntry.payments = monthEntry.payments || [];
    monthEntry.payments.push({
      paymentId: paymentDoc._id,
      amount: numericAmount,
      method,
      transactionRef,
      paymentDate: paymentDoc.paymentDate,
    });

    paymentDoc.remainingBalance = monthEntry.remainingAmount;
    paymentDoc.isPartial = monthEntry.remainingAmount > 0;

    await contract.save();
    await paymentDoc.save();

    const unit = await RentalUnit.findById(contract.unitId);
    if (unit) {
      unit.history = unit.history || [];
      unit.history.push({
        contractId,
        action: 'payment',
        meta: {
          monthYear,
          amount: numericAmount,
          method,
          transactionRef,
          remaining: monthEntry.remainingAmount,
        },
      });
      await unit.save();
    }

    res.status(201).json({ message: 'تم تسجيل الدفعة', payment: paymentDoc, contract });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تسجيل الدفعة', error: error.message });
  }
});

router.get('/contract/:contractId', async (req, res) => {
  try {
    const payments = await RentalPayment.find({ contractId: req.params.contractId })
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المدفوعات', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { contractId, monthYear } = req.query;
    const query = {};
    if (contractId) query.contractId = contractId;
    if (monthYear) query.monthYear = monthYear;
    const payments = await RentalPayment.find(query).sort({ paymentDate: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المدفوعات', error: error.message });
  }
});

module.exports = router;


const express = require('express');
const dayjs = require('dayjs');
const RentalContract = require('../models/RentalContract');

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

router.get('/', async (req, res) => {
  try {
    const { month, unitId, secretaryId } = req.query;
    const targetMonth = month || dayjs().format('YYYY-MM');

    const query = {};
    if (unitId) query.unitId = unitId;
    if (secretaryId) query.rentalSecretaryId = secretaryId;

    const contracts = await RentalContract.find(query)
      .populate('unitId', 'unitNumber unitType address')
      .populate('rentalSecretaryId', 'name phone');

    const summary = {
      expected: 0,
      paid: 0,
      partiallyPaid: 0,
      unpaid: 0,
      overdue: 0,
    };

    const breakdown = [];

    contracts.forEach((contract) => {
      const monthEntry = contract.months.find((m) => m.monthYear === targetMonth);
      if (!monthEntry) return;

      const entry = {
        contractId: contract._id,
        referenceNumber: contract.referenceNumber,
        unit: contract.unitId ? {
          _id: contract.unitId._id,
          unitNumber: contract.unitId.unitNumber,
          unitType: contract.unitId.unitType,
          address: contract.unitId.address,
        } : contract.unitSnapshot,
        secretary: contract.rentalSecretaryId ? {
          _id: contract.rentalSecretaryId._id,
          name: contract.rentalSecretaryId.name,
          phone: contract.rentalSecretaryId.phone,
        } : contract.secretarySnapshot,
        dueAmount: monthEntry.dueAmount,
        paidAmount: monthEntry.totalPaid,
        remainingAmount: monthEntry.remainingAmount,
        status: monthEntry.status,
        dueDate: monthEntry.dueDate,
      };

      summary.expected += monthEntry.dueAmount;
      summary.paid += monthEntry.totalPaid;

      if (monthEntry.remainingAmount > 0) {
        summary.unpaid += monthEntry.remainingAmount;
        if (monthEntry.totalPaid > 0) {
          summary.partiallyPaid += monthEntry.remainingAmount;
        }
        if (dayjs().isAfter(dayjs(monthEntry.dueDate))) {
          summary.overdue += monthEntry.remainingAmount;
        }
      }

      breakdown.push(entry);
    });

    breakdown.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());

    res.json({
      month: targetMonth,
      summary,
      breakdown,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المحاسبة', error: error.message });
  }
});

module.exports = router;


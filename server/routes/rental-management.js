const express = require('express');
const dayjs = require('dayjs');
const RentalContract = require('../models/RentalContract');
const RentalUnit = require('../models/RentalUnit');
const RentingSecretary = require('../models/RentingSecretary');

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

function classifyMonth(month) {
  if (month.remainingAmount <= 0) return 'paid';
  const today = dayjs();
  if (today.isAfter(dayjs(month.dueDate)) && month.remainingAmount > 0) {
    return month.totalPaid > 0 ? 'overdue' : 'overdue';
  }
  if (month.totalPaid > 0) return 'partiallyPaid';
  return 'pending';
}

router.get('/', async (req, res) => {
  try {
    const contracts = await RentalContract.find({})
      .populate('unitId', 'unitNumber unitType address')
      .populate('rentalSecretaryId', 'name phone');

    const buckets = {
      pending: [],
      overdue: [],
      partiallyPaid: [],
      paid: [],
    };

    contracts.forEach((contract) => {
      contract.months.forEach((month) => {
        const bucket = classifyMonth(month);
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
          monthYear: month.monthYear,
          dueDate: month.dueDate,
          dueAmount: month.dueAmount,
          totalPaid: month.totalPaid,
          remainingAmount: month.remainingAmount,
          status: month.status,
        };
        buckets[bucket].push(entry);
      });
    });

    const sortByDate = (a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf();
    buckets.pending.sort(sortByDate);
    buckets.overdue.sort(sortByDate);
    buckets.partiallyPaid.sort(sortByDate);
    buckets.paid.sort(sortByDate);

    res.json(buckets);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الإدارة', error: error.message });
  }
});

module.exports = router;


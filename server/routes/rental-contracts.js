const express = require('express');
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

router.get('/', async (req, res) => {
  try {
    const { status, unitId, secretaryId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (unitId) query.unitId = unitId;
    if (secretaryId) query.rentalSecretaryId = secretaryId;

    const contracts = await RentalContract.find(query)
      .populate('unitId', 'unitNumber unitType address status')
      .populate('rentalSecretaryId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب العقود', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contract = await RentalContract.findById(req.params.id)
      .populate('unitId', 'unitNumber unitType address status')
      .populate('rentalSecretaryId', 'name phone email');
    if (!contract) return res.status(404).json({ message: 'العقد غير موجود' });
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب العقد', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      unitId,
      rentalSecretaryId,
      rentAmount,
      startDate,
      dueDay,
      durationMonths,
      notes,
    } = req.body;

    if (!unitId || !rentalSecretaryId || !rentAmount || !startDate || !dueDay) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }

    const unit = await RentalUnit.findById(unitId);
    if (!unit) return res.status(404).json({ message: 'الوحدة غير موجودة' });
    if (unit.status !== 'متاح') {
      return res.status(400).json({ message: 'الوحدة غير متاحة للحجز' });
    }

    const secretary = await RentingSecretary.findById(rentalSecretaryId);
    if (!secretary) return res.status(404).json({ message: 'السكرتير غير موجود' });

    const contract = new RentalContract({
      unitId,
      unitSnapshot: {
        unitType: unit.unitType,
        unitNumber: unit.unitNumber,
        address: unit.address,
      },
      rentalSecretaryId,
      secretarySnapshot: {
        name: secretary.name,
        phone: secretary.phone,
        email: secretary.email,
      },
      rentAmount,
      startDate,
      dueDay,
      durationMonths,
      notes,
    });

    contract.ensureSchedule();
    await contract.save();

    unit.status = 'نشط';
    unit.currentContract = contract._id;
    unit.history = unit.history || [];
    unit.history.push({
      contractId: contract._id,
      action: 'create_contract',
      meta: { rentAmount, durationMonths },
    });
    await unit.save();

    res.status(201).json({ message: 'تم إنشاء العقد', contract });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء العقد', error: error.message });
  }
});

router.patch('/:id/terminate', async (req, res) => {
  try {
    const { reason } = req.body;
    const contract = await RentalContract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'العقد غير موجود' });
    if (contract.status === 'منتهي') {
      return res.status(400).json({ message: 'العقد منتهي بالفعل' });
    }

    contract.status = 'منتهي';
    contract.terminationDate = new Date();
    contract.terminationReason = reason;
    await contract.save();

    const unit = await RentalUnit.findById(contract.unitId);
    if (unit) {
      unit.status = 'متاح';
      unit.currentContract = null;
      unit.history = unit.history || [];
      unit.history.push({
        contractId: contract._id,
        action: 'terminate_contract',
        meta: { reason },
      });
      await unit.save();
    }

    res.json({ message: 'تم إنهاء العقد', contract });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنهاء العقد', error: error.message });
  }
});

module.exports = router;


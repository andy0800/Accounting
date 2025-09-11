const express = require('express');
const router = express.Router();
const RentalUnit = require('../models/RentalUnit');
const RentingSecretary = require('../models/RentingSecretary');
const RentalContract = require('../models/RentalContract');

// Get all rental units with populated secretary data
router.get('/', async (req, res) => {
  try {
    const { search, status, secretaryId, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: 'i' } },
        { unitType: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Secretary filter
    if (secretaryId) {
      query.secretaryId = secretaryId;
    }
    
    const skip = (page - 1) * limit;
    
    const units = await RentalUnit.find(query)
      .populate('secretaryId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await RentalUnit.countDocuments(query);
    
    res.json({
      units,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الوحدات', error: error.message });
  }
});

// Get single rental unit with full details
router.get('/:id', async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id)
      .populate('secretaryId', 'name phone email address idNumber documents');
    
    if (!unit) {
      return res.status(404).json({ message: 'الوحدة غير موجودة' });
    }
    
    // Get contract information
    const contract = await RentalContract.findOne({ 
      unitId: req.params.id, 
      status: 'نشط' 
    });
    
    // Get payment summary for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const payments = await require('../models/RentalPayment').find({
      contractId: contract?._id,
      monthYear: currentMonth
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = contract ? contract.monthlyRent - totalPaid : 0;
    
    const unitData = {
      ...unit.toObject(),
      contract,
      currentMonthPayments: payments,
      currentMonthTotalPaid: totalPaid,
      currentMonthRemaining: remainingBalance,
      paymentStatus: remainingBalance === 0 ? 'مدفوع بالكامل' : 
                    totalPaid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'
    };
    
    res.json(unitData);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الوحدة', error: error.message });
  }
});

// Create new rental unit
router.post('/', async (req, res) => {
  try {
    const { 
      unitType, 
      unitNumber, 
      address, 
      monthlyRent, 
      secretaryId, 
      description 
    } = req.body;
    
    // Check if unit number already exists
    const existingUnit = await RentalUnit.findOne({ unitNumber });
    if (existingUnit) {
      return res.status(400).json({ message: 'رقم الوحدة موجود مسبقاً' });
    }
    
    // Validate secretary if provided
    if (secretaryId) {
      const secretary = await RentingSecretary.findById(secretaryId);
      if (!secretary) {
        return res.status(400).json({ message: 'السكرتير غير موجود' });
      }
    }
    
    const unit = new RentalUnit({
      unitType,
      unitNumber,
      address,
      rentAmount: monthlyRent,
      secretaryId,
      notes: description,
      status: secretaryId ? 'نشط' : 'متاح' // Set status based on whether secretary is assigned
    });
    
    await unit.save();
    
    res.status(201).json({ 
      message: secretaryId ? 'تم إنشاء الوحدة مع تعيين السكرتير بنجاح' : 'تم إنشاء الوحدة بنجاح',
      unit
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء الوحدة', error: error.message });
  }
});

// Update rental unit
router.put('/:id', async (req, res) => {
  try {
    const { 
      unitType, 
      unitNumber, 
      address, 
      monthlyRent, 
      secretaryId, 
      description, 
      status 
    } = req.body;
    
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'الوحدة غير موجودة' });
    }
    
    // Check if unit number already exists for other units
    if (unitNumber && unitNumber !== unit.unitNumber) {
      const existingUnit = await RentalUnit.findOne({ 
        unitNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingUnit) {
        return res.status(400).json({ message: 'رقم الوحدة موجود مسبقاً' });
      }
    }
    
    // Validate secretary if changed
    if (secretaryId && secretaryId !== unit.secretaryId?.toString()) {
      const secretary = await RentingSecretary.findById(secretaryId);
      if (!secretary) {
        return res.status(400).json({ message: 'السكرتير غير موجود' });
      }
    }
    
    // Update fields
    unit.unitType = unitType || unit.unitType;
    unit.unitNumber = unitNumber || unit.unitNumber;
    unit.address = address || unit.address;
    unit.rentAmount = monthlyRent || unit.rentAmount;
    unit.secretaryId = secretaryId || unit.secretaryId;
    unit.notes = description || unit.notes;
    unit.status = status || unit.status;
    
    await unit.save();
    
    res.json({ 
      message: 'تم تحديث بيانات الوحدة بنجاح',
      unit 
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث بيانات الوحدة', error: error.message });
  }
});

// Delete rental unit
router.delete('/:id', async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'الوحدة غير موجودة' });
    }
    
    // Check if unit has active contract
    const activeContract = await RentalContract.findOne({ 
      unitId: req.params.id, 
      status: 'نشط' 
    });
    
    if (activeContract) {
      return res.status(400).json({ 
        message: 'لا يمكن حذف الوحدة لوجود عقد نشط. يرجى إنهاء العقد أولاً' 
      });
    }
    
    await RentalUnit.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الوحدة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الوحدة', error: error.message });
  }
});

// Assign unit to secretary and create contract
router.post('/:id/assign', async (req, res) => {
  try {
    const { secretaryId, startDate, monthlyRent, dueDay, notes } = req.body;
    
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'الوحدة غير موجودة' });
    }
    
    if (unit.status !== 'متاح') {
      return res.status(400).json({ message: 'الوحدة غير متاحة للإيجار' });
    }
    
    // Validate secretary exists
    const secretary = await RentingSecretary.findById(secretaryId);
    if (!secretary) {
      return res.status(400).json({ message: 'السكرتير غير موجود' });
    }
    
    // Check if secretary already has an active contract for this unit
    const existingContract = await RentalContract.findOne({
      unitId: req.params.id,
      secretaryId,
      status: 'نشط'
    });
    
    if (existingContract) {
      return res.status(400).json({ message: 'السكرتير لديه عقد نشط لهذه الوحدة بالفعل' });
    }
    
    // Validate due day
    const finalDueDay = dueDay || unit.dueDay;
    if (finalDueDay < 1 || finalDueDay > 31) {
      return res.status(400).json({ message: 'يوم الاستحقاق يجب أن يكون بين 1 و 31' });
    }
    
    // Validate monthly rent
    const finalMonthlyRent = monthlyRent || unit.rentAmount;
    if (finalMonthlyRent <= 0) {
      return res.status(400).json({ message: 'الإيجار الشهري يجب أن يكون أكبر من صفر' });
    }
    
    // Validate start date
    const finalStartDate = startDate || unit.startDate;
    const start = new Date(finalStartDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'تاريخ البدء غير صحيح' });
    }
    
    // Create rental contract
    const contract = new RentalContract({
      unitId: unit._id,
      secretaryId,
      startDate: finalStartDate,
      monthlyRent: finalMonthlyRent,
      dueDay: finalDueDay,
      notes
    });
    
    await contract.save();
    
    // Update unit status and assign secretary
    unit.secretaryId = secretaryId;
    unit.status = 'نشط';
    unit.rentAmount = finalMonthlyRent;
    unit.dueDay = finalDueDay;
    if (startDate) unit.startDate = finalStartDate;
    if (notes) unit.notes = notes;
    
    await unit.save();
    
    res.status(201).json({
      message: 'تم تعيين الوحدة للسكرتير وإنشاء العقد بنجاح',
      unit,
      contract
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تعيين الوحدة', error: error.message });
  }
});

// Get available units (units that can be assigned to secretaries)
router.get('/available/list', async (req, res) => {
  try {
    const availableUnits = await RentalUnit.find({ 
      status: 'متاح' 
    }).select('unitNumber unitType address rentAmount startDate dueDay');
    
    res.json(availableUnits);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الوحدات المتاحة', error: error.message });
  }
});

// Get units by secretary
router.get('/secretary/:secretaryId', async (req, res) => {
  try {
    const units = await RentalUnit.find({ 
      secretaryId: req.params.secretaryId,
      status: 'نشط'
    }).populate('secretaryId', 'name phone email');
    
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب وحدات السكرتير', error: error.message });
  }
});

// Get units summary for dashboard
router.get('/dashboard/summary', async (req, res) => {
  try {
    const totalUnits = await RentalUnit.countDocuments();
    const activeUnits = await RentalUnit.countDocuments({ status: 'نشط' });
    const terminatedUnits = await RentalUnit.countDocuments({ status: 'منتهي' });
    
    // Calculate total monthly rent
    const activeUnitsData = await RentalUnit.find({ status: 'نشط' });
    const totalMonthlyRent = activeUnitsData.reduce((sum, unit) => sum + unit.rentAmount, 0);
    
    res.json({
      totalUnits,
      activeUnits,
      terminatedUnits,
      totalMonthlyRent
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب ملخص الوحدات', error: error.message });
  }
});

module.exports = router;

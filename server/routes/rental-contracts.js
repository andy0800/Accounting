const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RentalContract = require('../models/RentalContract');
const RentingSecretary = require('../models/RentingSecretary');
const RentalPayment = require('../models/RentalPayment');
// Ensure reference number exists (backfill for existing docs)
async function ensureReferenceNumber(contract) {
  if (!contract.referenceNumber) {
    const created = contract.createdAt ? new Date(contract.createdAt) : new Date();
    const year = created.getFullYear();
    const shortId = contract._id.toString().slice(-6).toUpperCase();
    contract.referenceNumber = `RC-${year}-${shortId}`;
    await contract.save();
  }
  return contract;
}

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/contracts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contract-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مسموح به'));
    }
  }
});

// Get all rental contracts with populated data
router.get('/', async (req, res) => {
  try {
    const { search, status, secretaryId, page = 1, limit = 10 } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    
    let query = {};
    
    // Search functionality - search in multiple fields
    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: 'i' } },
        { unitType: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
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
    
    const skip = (pageNum - 1) * limitNum;
    
    const contracts = await RentalContract.find(query)
      .populate('secretaryId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    // Backfill missing refs
    await Promise.all(contracts.map(c => ensureReferenceNumber(c)));

    const total = await RentalContract.countDocuments(query);
    
    res.json({
      contracts,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات العقود', error: error.message });
  }
});

// Get single rental contract with full details
router.get('/:id', async (req, res) => {
  try {
    const contract = await RentalContract.findById(req.params.id)
      .populate('secretaryId', 'name phone email address idNumber documents');
    
    if (!contract) {
      return res.status(404).json({ message: 'العقد غير موجود' });
    }
    // Backfill missing reference number
    await ensureReferenceNumber(contract);

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات العقد', error: error.message });
  }
});

// Create new rental contract
router.post('/', upload.array('documents', 5), async (req, res) => {
  try {
    const { secretaryId, unitType, unitNumber, address, rentAmount, startDate, dueDay, notes } = req.body;
    
    // Validate required fields
    if (!secretaryId || !unitType || !unitNumber || !address || !rentAmount || !startDate || !dueDay) {
      return res.status(400).json({ 
        message: 'جميع الحقول المطلوبة يجب ملؤها: السكرتير، نوع الوحدة، رقم الوحدة، العنوان، مبلغ الإيجار، تاريخ البدء، يوم الاستحقاق' 
      });
    }
    
    // Validate due day range
    if (dueDay < 1 || dueDay > 31) {
      return res.status(400).json({ 
        message: 'يوم الاستحقاق يجب أن يكون بين 1 و 31' 
      });
    }
    
    // Validate rent amount
    if (rentAmount <= 0) {
      return res.status(400).json({ 
        message: 'مبلغ الإيجار يجب أن يكون أكبر من صفر' 
      });
    }
    
    // Check if unit number already exists
    const existingContract = await RentalContract.findOne({
      unitNumber,
      status: 'نشط'
    });
    
    if (existingContract) {
      return res.status(400).json({ message: 'رقم الوحدة مستخدم بالفعل في عقد نشط' });
    }
    
    // Validate secretary exists
    const secretary = await RentingSecretary.findById(secretaryId);
    if (!secretary) {
      return res.status(400).json({ message: 'السكرتير غير موجود' });
    }
    
    // Validate dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'تاريخ البدء غير صحيح' });
    }
    
    // Process uploaded documents
    let documents = [];
    if (req.files && req.files.length > 0) {
      documents = req.files.map(file => ({
        name: file.originalname,
        filePath: file.filename,
        uploadDate: new Date()
      }));
    }

    const contract = new RentalContract({
      secretaryId,
      unitType,
      unitNumber,
      address,
      rentAmount,
      startDate,
      dueDay,
      documents,
      notes
    });
    
    await contract.save();
    
    res.status(201).json({
      message: 'تم إنشاء العقد بنجاح',
      contract
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء العقد', error: error.message });
  }
});

// Update rental contract
router.put('/:id', upload.array('documents', 5), async (req, res) => {
  try {
    const { unitType, unitNumber, address, rentAmount, startDate, dueDay, status, terminationDate, terminationReason, notes } = req.body;
    
    const contract = await RentalContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'العقد غير موجود' });
    }
    
    // Validate due day range if provided
    if (dueDay !== undefined && (dueDay < 1 || dueDay > 31)) {
      return res.status(400).json({ 
        message: 'يوم الاستحقاق يجب أن يكون بين 1 و 31' 
      });
    }
    
    // Validate rent amount if provided
    if (rentAmount !== undefined && rentAmount <= 0) {
      return res.status(400).json({ 
        message: 'مبلغ الإيجار يجب أن يكون أكبر من صفر' 
      });
    }
    
    // Check if unit number already exists (excluding current contract)
    if (unitNumber && unitNumber !== contract.unitNumber) {
      const existingContract = await RentalContract.findOne({
        unitNumber,
        status: 'نشط',
        _id: { $ne: contract._id }
      });
      
      if (existingContract) {
        return res.status(400).json({ message: 'رقم الوحدة مستخدم بالفعل في عقد نشط' });
      }
    }
    
    // Validate dates if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: 'تاريخ البدء غير صحيح' });
      }
    }
    
    // Process uploaded documents
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        name: file.originalname,
        filePath: file.filename,
        uploadDate: new Date()
      }));
      
      // Add new documents to existing ones
      contract.documents = [...(contract.documents || []), ...newDocuments];
    }

    // Update fields
    if (unitType) contract.unitType = unitType;
    if (unitNumber) contract.unitNumber = unitNumber;
    if (address) contract.address = address;
    if (rentAmount) contract.rentAmount = rentAmount;
    if (startDate) contract.startDate = startDate;
    if (dueDay) contract.dueDay = dueDay;
    if (status) contract.status = status;
    if (terminationDate) contract.terminationDate = terminationDate;
    if (terminationReason) contract.terminationReason = terminationReason;
    if (notes !== undefined) contract.notes = notes;
    
    await contract.save();
    
    res.json({
      message: 'تم تحديث العقد بنجاح',
      contract
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث العقد', error: error.message });
  }
});

// Terminate a rental contract
router.patch('/:id/terminate', async (req, res) => {
  try {
    const { terminationReason, notes } = req.body;
    
    if (!terminationReason) {
      return res.status(400).json({ message: 'سبب الإنهاء مطلوب' });
    }

    const contract = await RentalContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'العقد غير موجود' });
    }

    if (contract.status === 'منتهي') {
      return res.status(400).json({ message: 'العقد منتهي بالفعل' });
    }

    contract.status = 'منتهي';
    contract.terminationDate = new Date().toISOString();
    contract.terminationReason = terminationReason;
    if (notes) {
      contract.notes = notes;
    }

    await contract.save();

    res.json({ 
      message: 'تم إنهاء العقد بنجاح',
      contract 
    });
  } catch (error) {
    console.error('Error terminating contract:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Delete rental contract (only if no payments exist)
router.delete('/:id', async (req, res) => {
  try {
    const contract = await RentalContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'العقد غير موجود' });
    }
    
    // Check if contract has payments
    const payments = await RentalPayment.find({ contractId: req.params.id });
    
    if (payments.length > 0) {
      return res.status(400).json({ 
        message: 'لا يمكن حذف العقد لوجود مدفوعات مرتبطة به' 
      });
    }
    
    await RentalContract.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'تم حذف العقد بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف العقد', error: error.message });
  }
});

// Get terminated contracts
router.get('/terminated', async (req, res) => {
  try {
    const terminatedContracts = await RentalContract.find({ status: 'منتهي' })
      .populate('secretaryId')
      .populate('documents')
      .sort({ terminationDate: -1 });

    // Get payment data for each terminated contract
    const terminatedRentals = await Promise.all(
      terminatedContracts.map(async (contract) => {
        const payments = await RentalPayment.find({ contractId: contract._id });
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculate total owed based on contract duration
        const startDate = new Date(contract.startDate);
        const endDate = new Date(contract.terminationDate);
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth()) + 1;
        const totalOwed = contract.rentAmount * monthsDiff;
        const finalBalance = totalOwed - totalPaid;
        
        const lastPayment = payments.length > 0 ? 
          payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0] : null;

        return {
          contract,
          totalPaid,
          totalOwed,
          finalBalance,
          lastPaymentDate: lastPayment?.paymentDate,
          paymentHistory: payments
        };
      })
    );

    res.json({ terminatedRentals });
  } catch (error) {
    console.error('Error fetching terminated contracts:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Get contract details with monthly payments, past months, and upcoming months
router.get('/:id/details', async (req, res) => {
  try {
    const contract = await RentalContract.findById(req.params.id)
      .populate('secretaryId')
      .populate('documents');

    if (!contract) {
      return res.status(404).json({ message: 'العقد غير موجود' });
    }

    // Get all payments for this contract
    const payments = await RentalPayment.find({ contractId: req.params.id })
      .sort({ paymentDate: -1 });

    // Group payments by month
    const monthlyPaymentsMap = new Map();
    payments.forEach(payment => {
      if (!monthlyPaymentsMap.has(payment.monthYear)) {
        monthlyPaymentsMap.set(payment.monthYear, []);
      }
      monthlyPaymentsMap.get(payment.monthYear).push(payment);
    });

    // Calculate monthly payment data
    const monthlyPayments = [];
    const currentDate = new Date();
    const startDate = new Date(contract.startDate);
    
    // Generate months from start date to current date + 6 months ahead
    for (let i = 0; i < 24; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const monthYear = monthDate.toISOString().slice(0, 7);
      
      const monthPayments = monthlyPaymentsMap.get(monthYear) || [];
      const totalPaid = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingBalance = Math.max(0, contract.rentAmount - totalPaid);
      
      let status = 'غير مدفوع';
      if (totalPaid >= contract.rentAmount) {
        status = 'مدفوع بالكامل';
      } else if (totalPaid > 0) {
        status = 'مدفوع جزئياً';
      }

      monthlyPayments.push({
        monthYear,
        totalPaid,
        remainingBalance,
        isFullyPaid: totalPaid >= contract.rentAmount,
        isPartiallyPaid: totalPaid > 0 && totalPaid < contract.rentAmount,
        status,
        payments: monthPayments
      });
    }

    // Get past months (last 12 months)
    const pastMonths = monthlyPayments
      .filter(month => {
        const monthDate = new Date(month.monthYear + '-01');
        return monthDate < currentDate;
      })
      .slice(-12);

    // Get upcoming months (next 6 months)
    const upcomingMonths = monthlyPayments
      .filter(month => {
        const monthDate = new Date(month.monthYear + '-01');
        return monthDate >= currentDate;
      })
      .slice(0, 6)
      .map(month => ({
        monthYear: month.monthYear,
        dueDate: new Date(month.monthYear + '-' + contract.dueDay.toString().padStart(2, '0')),
        expectedAmount: contract.rentAmount,
        status: 'قادم'
      }));

    res.json({
      contract,
      monthlyPayments,
      pastMonths,
      upcomingMonths
    });
  } catch (error) {
    console.error('Error fetching contract details:', error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Download contract document
router.get('/:id/document/:documentId', async (req, res) => {
  try {
    const contract = await RentalContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        message: 'العقد غير موجود'
      });
    }

    const document = contract.documents?.find(doc => doc.filePath === req.params.documentId);
    if (!document) {
      return res.status(404).json({
        message: 'المستند غير موجود'
      });
    }

    const filePath = path.join(__dirname, '../uploads/contracts', document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'الملف غير موجود'
      });
    }

    res.download(filePath, document.name);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;

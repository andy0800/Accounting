const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RentalPayment = require('../models/RentalPayment');
const RentalContract = require('../models/RentalContract');

// Configure multer for receipt document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
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

// Create a new rental payment
router.post('/', upload.single('receiptDocument'), async (req, res) => {
  try {
    const {
      contractId,
      monthYear,
      amount,
      description,
      paymentMethod,
      notes,
      isPartial = false
    } = req.body;

    // Validate required fields
    if (!contractId || !monthYear || !amount || !description || !paymentMethod) {
      return res.status(400).json({
        message: 'جميع الحقول المطلوبة يجب ملؤها'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        message: 'مبلغ الدفعة يجب أن يكون أكبر من صفر'
      });
    }

    // Check if contract exists
    const contract = await RentalContract.findById(contractId);
    if (!contract) {
      return res.status(404).json({
        message: 'العقد غير موجود'
      });
    }

    // Check if contract is active
    if (contract.status !== 'نشط') {
      return res.status(400).json({
        message: 'لا يمكن إضافة دفعة لعقد منتهي'
      });
    }

    // Calculate remaining balance for the month
    const existingPayments = await RentalPayment.find({
      contractId,
      monthYear
    });

    const totalPaidForMonth = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = Math.max(0, contract.rentAmount - totalPaidForMonth - amount);

    // Process uploaded receipt document
    let receiptDocument = null;
    if (req.file) {
      receiptDocument = {
        name: req.file.originalname,
        filePath: req.file.filename,
        uploadDate: new Date()
      };
    }

    // Create payment record
    const payment = new RentalPayment({
      contractId,
      monthYear,
      amount,
      paymentDate: new Date().toISOString(),
      description,
      isPartial: isPartial || amount < contract.rentAmount,
      remainingBalance,
      receiptDocument,
      paymentMethod,
      notes
    });

    await payment.save();

    res.status(201).json({
      message: 'تم إضافة الدفعة بنجاح',
      payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Get all payments for a specific contract
router.get('/contract/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { monthYear, page = 1, limit = 50 } = req.query;

    let query = { contractId };
    if (monthYear) {
      query.monthYear = monthYear;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const payments = await RentalPayment.find(query)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await RentalPayment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Get payment summary for a contract
router.get('/contract/:contractId/summary', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { monthYear } = req.query;

    let query = { contractId };
    if (monthYear) {
      query.monthYear = monthYear;
    }

    const payments = await RentalPayment.find(query);
    
    const summary = {
      totalPayments: payments.length,
      totalAmountPaid: payments.reduce((sum, payment) => sum + payment.amount, 0),
      averagePayment: payments.length > 0 ? 
        (payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length).toFixed(2) : 0,
      partialPayments: payments.filter(p => p.isPartial).length,
      fullPayments: payments.filter(p => !p.isPartial).length,
      lastPaymentDate: payments.length > 0 ? 
        payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0].paymentDate : null
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Get a specific payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await RentalPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        message: 'الدفعة غير موجودة'
      });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Update a payment
router.put('/:id', upload.single('receiptDocument'), async (req, res) => {
  try {
    const {
      amount,
      description,
      paymentMethod,
      notes
    } = req.body;

    const payment = await RentalPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        message: 'الدفعة غير موجودة'
      });
    }

    // Update fields
    if (amount !== undefined) payment.amount = amount;
    if (description !== undefined) payment.description = description;
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (notes !== undefined) payment.notes = notes;
    
    // Process uploaded receipt document
    if (req.file) {
      payment.receiptDocument = {
        name: req.file.originalname,
        filePath: req.file.filename,
        uploadDate: new Date()
      };
    }

    // Recalculate remaining balance if amount changed
    if (amount !== undefined) {
      const contract = await RentalContract.findById(payment.contractId);
      if (contract) {
        const otherPayments = await RentalPayment.find({
          contractId: payment.contractId,
          monthYear: payment.monthYear,
          _id: { $ne: payment._id }
        });
        
        const totalPaidForMonth = otherPayments.reduce((sum, p) => sum + p.amount, 0) + amount;
        payment.remainingBalance = Math.max(0, contract.rentAmount - totalPaidForMonth);
        payment.isPartial = amount < contract.rentAmount;
      }
    }

    await payment.save();

    res.json({
      message: 'تم تحديث الدفعة بنجاح',
      payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Delete a payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await RentalPayment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        message: 'الدفعة غير موجودة'
      });
    }

    await RentalPayment.findByIdAndDelete(req.params.id);

    res.json({
      message: 'تم حذف الدفعة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Get monthly payment status for a contract
router.get('/contract/:contractId/monthly-status', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { monthYear } = req.query;

    if (!monthYear) {
      return res.status(400).json({
        message: 'الشهر والسنة مطلوبان'
      });
    }

    const contract = await RentalContract.findById(contractId);
    if (!contract) {
      return res.status(404).json({
        message: 'العقد غير موجود'
      });
    }

    const payments = await RentalPayment.find({
      contractId,
      monthYear
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = Math.max(0, contract.rentAmount - totalPaid);
    const isFullyPaid = totalPaid >= contract.rentAmount;
    const isPartiallyPaid = totalPaid > 0 && !isFullyPaid;

    let status = 'غير مدفوع';
    if (isFullyPaid) {
      status = 'مدفوع بالكامل';
    } else if (isPartiallyPaid) {
      status = 'مدفوع جزئياً';
    }

    res.json({
      monthYear,
      totalPaid,
      remainingBalance,
      isFullyPaid,
      isPartiallyPaid,
      status,
      payments,
      expectedAmount: contract.rentAmount
    });
  } catch (error) {
    console.error('Error fetching monthly status:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Download receipt document
router.get('/:id/receipt', async (req, res) => {
  try {
    const payment = await RentalPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        message: 'الدفعة غير موجودة'
      });
    }

    if (!payment.receiptDocument) {
      return res.status(404).json({
        message: 'لا يوجد إيصال مرفق'
      });
    }

    const filePath = path.join(__dirname, '../uploads/receipts', payment.receiptDocument.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'الملف غير موجود'
      });
    }

    res.download(filePath, payment.receiptDocument.name);
  } catch (error) {
    console.error('Error downloading receipt:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

// Upload receipt document to existing payment
router.post('/:id/receipt', upload.single('receipt'), async (req, res) => {
  try {
    const payment = await RentalPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        message: 'الدفعة غير موجودة'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'يجب رفع ملف الإيصال'
      });
    }

    // Delete old receipt file if exists
    if (payment.receiptDocument && payment.receiptDocument.filePath) {
      const oldFilePath = path.join(__dirname, '../uploads/receipts', payment.receiptDocument.filePath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update payment with new receipt
    payment.receiptDocument = {
      name: req.file.originalname,
      filePath: req.file.filename,
      uploadDate: new Date()
    };

    await payment.save();

    res.json({
      message: 'تم رفع الإيصال بنجاح',
      receiptDocument: payment.receiptDocument
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;

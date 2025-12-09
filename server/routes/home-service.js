const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const HSInvoice = require('../models/HSInvoice');
const HSTransaction = require('../models/HSTransaction');
const HSAccount = require('../models/HSAccount');

const router = express.Router();

// ==================== MIDDLEWARE ====================

// Authentication middleware
function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'غير مصرح' });
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'جلسة غير صالحة' });
  }
}

// Role check middleware - admin and home_service_user only
function requireHomeServiceAccess(req, res, next) {
  const allowedRoles = ['admin', 'home_service_user'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'غير مصرح بالوصول لهذا القسم' });
  }
  return next();
}

// Admin only middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'هذا الإجراء للمسؤول فقط' });
  }
  return next();
}

router.use(requireAuth);
router.use(requireHomeServiceAccess);

// ==================== FILE UPLOAD ====================

const uploadDir = path.join(__dirname, '../uploads/home-service');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `hs-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    return cb(new Error('نوع الملف غير مدعوم'));
  },
});

// ==================== DASHBOARD ====================

router.get('/dashboard', async (req, res) => {
  try {
    const account = await HSAccount.getAccount();
    
    // Get recent transactions (last 10)
    const recentTransactions = await HSTransaction.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('performedBy', 'username');
    
    // Get invoice counts
    const [incomeCount, spendingCount, deletedCount] = await Promise.all([
      HSInvoice.countDocuments({ type: 'income', status: 'active' }),
      HSInvoice.countDocuments({ type: 'spending', status: 'active' }),
      HSInvoice.countDocuments({ status: 'deleted' }),
    ]);
    
    res.json({
      fundingCredit: account.fundingCredit,
      incomeProfit: account.incomeProfit,
      invoiceCounts: {
        income: incomeCount,
        spending: spendingCount,
        deleted: deletedCount,
        total: incomeCount + spendingCount,
      },
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات لوحة التحكم', error: error.message });
  }
});

// ==================== INVOICES ====================

// List invoices with filters
router.get('/invoices', async (req, res) => {
  try {
    const { type, status = 'active', page = 1, limit = 50, search } = req.query;
    
    const filters = { status };
    if (type && type !== 'all') {
      filters.type = type;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [
        { referenceNumber: regex },
        { name: regex },
        { details: regex },
      ];
    }
    
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;
    
    const [invoices, total] = await Promise.all([
      HSInvoice.find(filters)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username')
        .populate('deletedBy', 'username'),
      HSInvoice.countDocuments(filters),
    ]);
    
    res.json({
      invoices,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الفواتير', error: error.message });
  }
});

// Get deleted invoices (audit)
router.get('/deleted', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;
    
    const [invoices, total] = await Promise.all([
      HSInvoice.find({ status: 'deleted' })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username')
        .populate('deletedBy', 'username'),
      HSInvoice.countDocuments({ status: 'deleted' }),
    ]);
    
    res.json({
      invoices,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الفواتير المحذوفة', error: error.message });
  }
});

// Get single invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await HSInvoice.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('deletedBy', 'username')
      .populate('editHistory.editedBy', 'username');
    
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الفاتورة', error: error.message });
  }
});

// Create invoice
router.post('/invoices', upload.single('document'), async (req, res) => {
  try {
    const { type, name, value, date, details } = req.body;
    
    // Validation
    if (!type || !name || !value || !date) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ message: 'قيمة الفاتورة غير صالحة' });
    }
    
    // Get account
    const account = await HSAccount.getAccount();
    
    // For spending, check funding credit availability
    if (type === 'spending') {
      if (numValue > account.fundingCredit) {
        return res.status(400).json({ 
          message: 'رصيد التمويل غير كافٍ',
          available: account.fundingCredit,
          required: numValue,
        });
      }
    }
    
    // Generate reference number
    const referenceNumber = await HSAccount.getNextReference(type);
    
    // Create invoice
    const invoiceData = {
      referenceNumber,
      type,
      name,
      value: numValue,
      date: new Date(date),
      details,
      createdBy: req.user.userId,
    };
    
    if (req.file) {
      invoiceData.document = {
        name: req.file.originalname,
        filePath: req.file.filename,
      };
    }
    
    const invoice = new HSInvoice(invoiceData);
    await invoice.save();
    
    // Update account and create transaction
    let balanceAfter;
    let category;
    
    if (type === 'income') {
      account.incomeProfit += numValue;
      balanceAfter = account.incomeProfit;
      category = 'income';
    } else {
      account.fundingCredit -= numValue;
      balanceAfter = account.fundingCredit;
      category = 'funding';
    }
    
    await account.save();
    
    // Create transaction record
    await HSTransaction.create({
      type,
      amount: type === 'income' ? numValue : -numValue,
      balanceAfter,
      category,
      date: new Date(date),
      invoiceId: invoice._id,
      invoiceRef: referenceNumber,
      description: `${type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${name}`,
      performedBy: req.user.userId,
    });
    
    res.status(201).json({ message: 'تم إنشاء الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء الفاتورة', error: error.message });
  }
});

// Edit invoice
router.put('/invoices/:id', upload.single('document'), async (req, res) => {
  try {
    const invoice = await HSInvoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }
    
    if (invoice.status === 'deleted') {
      return res.status(400).json({ message: 'لا يمكن تعديل فاتورة محذوفة' });
    }
    
    const { name, value, date, details } = req.body;
    const editHistory = [];
    const account = await HSAccount.getAccount();
    
    // Handle value change with balance adjustment
    if (value !== undefined) {
      const newValue = parseFloat(value);
      if (isNaN(newValue) || newValue <= 0) {
        return res.status(400).json({ message: 'قيمة الفاتورة غير صالحة' });
      }
      
      const difference = newValue - invoice.value;
      
      if (difference !== 0) {
        // For spending increase, check funding credit availability
        if (invoice.type === 'spending' && difference > 0) {
          if (difference > account.fundingCredit) {
            return res.status(400).json({ 
              message: 'رصيد التمويل غير كافٍ للزيادة',
              available: account.fundingCredit,
              required: difference,
            });
          }
        }
        
        // Record edit history
        editHistory.push({
          field: 'value',
          oldValue: invoice.value,
          newValue: newValue,
          editedAt: new Date(),
          editedBy: req.user.userId,
        });
        
        // Adjust balances
        let balanceAfter;
        let category;
        
        if (invoice.type === 'income') {
          account.incomeProfit += difference;
          balanceAfter = account.incomeProfit;
          category = 'income';
        } else {
          account.fundingCredit -= difference;
          balanceAfter = account.fundingCredit;
          category = 'funding';
        }
        
        await account.save();
        
        // Create adjustment transaction
        await HSTransaction.create({
          type: `${invoice.type}_adjustment`,
          amount: invoice.type === 'income' ? difference : -difference,
          balanceAfter,
          category,
          date: new Date(),
          invoiceId: invoice._id,
          invoiceRef: invoice.referenceNumber,
          description: `تعديل قيمة ${invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${invoice.name} (${invoice.value} → ${newValue})`,
          performedBy: req.user.userId,
        });
        
        invoice.value = newValue;
      }
    }
    
    // Handle other field changes
    if (name !== undefined && name !== invoice.name) {
      editHistory.push({
        field: 'name',
        oldValue: invoice.name,
        newValue: name,
        editedAt: new Date(),
        editedBy: req.user.userId,
      });
      invoice.name = name;
    }
    
    if (date !== undefined) {
      const newDate = new Date(date);
      if (newDate.getTime() !== invoice.date.getTime()) {
        editHistory.push({
          field: 'date',
          oldValue: invoice.date,
          newValue: newDate,
          editedAt: new Date(),
          editedBy: req.user.userId,
        });
        invoice.date = newDate;
      }
    }
    
    if (details !== undefined && details !== invoice.details) {
      editHistory.push({
        field: 'details',
        oldValue: invoice.details,
        newValue: details,
        editedAt: new Date(),
        editedBy: req.user.userId,
      });
      invoice.details = details;
    }
    
    // Handle document upload
    if (req.file) {
      // Delete old document if exists
      if (invoice.document && invoice.document.filePath) {
        const oldFilePath = path.join(uploadDir, invoice.document.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      editHistory.push({
        field: 'document',
        oldValue: invoice.document ? invoice.document.name : null,
        newValue: req.file.originalname,
        editedAt: new Date(),
        editedBy: req.user.userId,
      });
      
      invoice.document = {
        name: req.file.originalname,
        filePath: req.file.filename,
      };
    }
    
    // Mark as edited if there were changes
    if (editHistory.length > 0) {
      invoice.isEdited = true;
      invoice.editHistory.push(...editHistory);
    }
    
    await invoice.save();
    
    res.json({ message: 'تم تحديث الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث الفاتورة', error: error.message });
  }
});

// Delete invoice (soft delete with amount reversal)
router.delete('/invoices/:id', async (req, res) => {
  try {
    const invoice = await HSInvoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }
    
    if (invoice.status === 'deleted') {
      return res.status(400).json({ message: 'الفاتورة محذوفة بالفعل' });
    }
    
    const account = await HSAccount.getAccount();
    
    // Reverse the amount
    let balanceAfter;
    let category;
    
    if (invoice.type === 'income') {
      account.incomeProfit -= invoice.value;
      if (account.incomeProfit < 0) account.incomeProfit = 0;
      balanceAfter = account.incomeProfit;
      category = 'income';
    } else {
      account.fundingCredit += invoice.value;
      balanceAfter = account.fundingCredit;
      category = 'funding';
    }
    
    await account.save();
    
    // Create reversal transaction
    await HSTransaction.create({
      type: `${invoice.type}_reversal`,
      amount: invoice.type === 'income' ? -invoice.value : invoice.value,
      balanceAfter,
      category,
      date: new Date(),
      invoiceId: invoice._id,
      invoiceRef: invoice.referenceNumber,
      description: `حذف ${invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${invoice.name}`,
      performedBy: req.user.userId,
    });
    
    // Soft delete
    invoice.status = 'deleted';
    invoice.deletedAt = new Date();
    invoice.deletedBy = req.user.userId;
    await invoice.save();
    
    res.json({ message: 'تم حذف الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الفاتورة', error: error.message });
  }
});

// ==================== FUNDING ====================

// Add funds (admin only)
router.post('/funding/add', requireAdmin, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || !description) {
      return res.status(400).json({ message: 'المبلغ والوصف مطلوبان' });
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'المبلغ غير صالح' });
    }
    
    const account = await HSAccount.getAccount();
    account.fundingCredit += numAmount;
    await account.save();
    
    // Create transaction
    await HSTransaction.create({
      type: 'add_funds',
      amount: numAmount,
      balanceAfter: account.fundingCredit,
      category: 'funding',
      date: new Date(),
      description,
      performedBy: req.user.userId,
    });
    
    res.json({ 
      message: 'تم إضافة الرصيد بنجاح', 
      fundingCredit: account.fundingCredit,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إضافة الرصيد', error: error.message });
  }
});

// ==================== ACCOUNTING ====================

// Get accounting summary
router.get('/accounting', async (req, res) => {
  try {
    const account = await HSAccount.getAccount();
    
    // Get transaction history grouped by category and calculate total spendings
    const [fundingTransactions, incomeTransactions, spendingsAggregation] = await Promise.all([
      HSTransaction.find({ category: 'funding' })
        .sort({ date: -1 })
        .limit(100)
        .populate('performedBy', 'username'),
      HSTransaction.find({ category: 'income' })
        .sort({ date: -1 })
        .limit(100)
        .populate('performedBy', 'username'),
      // Calculate total spendings from all active spending invoices
      HSInvoice.aggregate([
        { $match: { type: 'spending', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
    ]);
    
    // Extract total spendings value
    const totalSpendings = spendingsAggregation.length > 0 ? spendingsAggregation[0].total : 0;
    
    res.json({
      fundingCredit: account.fundingCredit,
      incomeProfit: account.incomeProfit,
      totalSpendings,
      fundingTransactions,
      incomeTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المحاسبة', error: error.message });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    if (category && category !== 'all') {
      filters.category = category;
    }
    
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;
    
    const [transactions, total] = await Promise.all([
      HSTransaction.find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('performedBy', 'username'),
      HSTransaction.countDocuments(filters),
    ]);
    
    res.json({
      transactions,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المعاملات', error: error.message });
  }
});

module.exports = router;


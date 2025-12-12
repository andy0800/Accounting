const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const FursatkumInvoice = require('../models/FursatkumInvoice');
const FursatkumTransaction = require('../models/FursatkumTransaction');
const FursatkumAccount = require('../models/FursatkumAccount');

const router = express.Router();

// ==================== MIDDLEWARE ====================

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

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'هذا الإجراء للمسؤول فقط' });
  }
  return next();
}

router.use(requireAuth);
router.use(requireAdmin); // Admin-only system

// ==================== FILE UPLOAD ====================

const uploadDir = path.join(__dirname, '../uploads/fursatkum');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `fursatkum-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    return cb(new Error('نوع الملف غير مدعوم'));
  },
});

// Helpers
const getLedgerField = (ledger) => (ledger === 'bank' ? 'bankBalance' : 'cashBalance');

// ==================== DASHBOARD ====================
router.get('/dashboard', async (req, res) => {
  try {
    const account = await FursatkumAccount.getAccount();
    const recentTransactions = await FursatkumTransaction.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('performedBy', 'username');

    const [incomeCount, spendingCount, deletedCount] = await Promise.all([
      FursatkumInvoice.countDocuments({ type: 'income', status: 'active' }),
      FursatkumInvoice.countDocuments({ type: 'spending', status: 'active' }),
      FursatkumInvoice.countDocuments({ status: 'deleted' }),
    ]);

    res.json({
      bankBalance: account.bankBalance,
      cashBalance: account.cashBalance,
      bankInfo: account.bankInfo,
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
    const { type, ledger, status = 'active', page = 1, limit = 50, search, startDate, endDate } = req.query;

    const filters = { status };
    if (type && type !== 'all') filters.type = type;
    if (ledger && ledger !== 'all') filters.ledger = ledger;
    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [
        { referenceNumber: regex },
        { bankReference: regex },
        { name: regex },
        { details: regex },
      ];
    }
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      FursatkumInvoice.find(filters)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username')
        .populate('deletedBy', 'username')
        .populate('editHistory.editedBy', 'username'),
      FursatkumInvoice.countDocuments(filters),
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

// Deleted invoices (audit)
router.get('/deleted', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      FursatkumInvoice.find({ status: 'deleted' })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username')
        .populate('deletedBy', 'username'),
      FursatkumInvoice.countDocuments({ status: 'deleted' }),
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

// Single invoice
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await FursatkumInvoice.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('deletedBy', 'username')
      .populate('editHistory.editedBy', 'username');
    if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الفاتورة', error: error.message });
  }
});

// Create invoice
router.post('/invoices', upload.single('document'), async (req, res) => {
  try {
    const { type, name, value, date, details, ledger, bankReference } = req.body;

    if (!type || !name || !value || !date || !ledger) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }

    if (!['income', 'spending'].includes(type)) {
      return res.status(400).json({ message: 'نوع الفاتورة غير صالح' });
    }
    if (!['cash', 'bank'].includes(ledger)) {
      return res.status(400).json({ message: 'مصدر/وجهة غير صالحة' });
    }
    if (ledger === 'bank' && !bankReference) {
      return res.status(400).json({ message: 'المرجع البنكي مطلوب عند اختيار الحساب البنكي' });
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ message: 'قيمة الفاتورة غير صالحة' });
    }

    const account = await FursatkumAccount.getAccount();
    const ledgerField = getLedgerField(ledger);

    if (type === 'spending') {
      if (numValue > account[ledgerField]) {
        return res.status(400).json({
          message: 'الرصيد غير كافٍ في المصدر المحدد',
          available: account[ledgerField],
          required: numValue,
        });
      }
      account[ledgerField] -= numValue;
    } else {
      account[ledgerField] += numValue;
    }

    const referenceNumber = await FursatkumAccount.getNextReference(type);

    const invoiceData = {
      referenceNumber,
      type,
      ledger,
      bankReference: ledger === 'bank' ? bankReference : undefined,
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

    const invoice = new FursatkumInvoice(invoiceData);
    await invoice.save();
    await account.save();

    // transaction
    await FursatkumTransaction.create({
      type,
      ledger,
      amount: type === 'income' ? numValue : -numValue,
      balanceAfter: account[ledgerField],
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
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'سبب التعديل مطلوب' });

    const invoice = await FursatkumInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    if (invoice.status === 'deleted') return res.status(400).json({ message: 'لا يمكن تعديل فاتورة محذوفة' });

    const { name, value, date, details, bankReference } = req.body;
    const editHistory = [];
    const account = await FursatkumAccount.getAccount();
    const ledgerField = getLedgerField(invoice.ledger);

    if (value !== undefined) {
      const newValue = parseFloat(value);
      if (isNaN(newValue) || newValue <= 0) {
        return res.status(400).json({ message: 'قيمة الفاتورة غير صالحة' });
      }
      const difference = newValue - invoice.value;
      if (difference !== 0) {
        // spending increase needs balance check
        if (invoice.type === 'spending' && difference > 0 && difference > account[ledgerField]) {
          return res.status(400).json({
            message: 'الرصيد غير كافٍ للزيادة',
            available: account[ledgerField],
            required: difference,
          });
        }

        editHistory.push({
          field: 'value',
          oldValue: invoice.value,
          newValue,
          reason,
          editedAt: new Date(),
          editedBy: req.user.userId,
        });

        let balanceAfter;
        if (invoice.type === 'income') {
          account[ledgerField] += difference;
        } else {
          account[ledgerField] -= difference;
        }
        balanceAfter = account[ledgerField];
        await account.save();

        await FursatkumTransaction.create({
          type: `${invoice.type}_adjustment`,
          ledger: invoice.ledger,
          amount: invoice.type === 'income' ? difference : -difference,
          balanceAfter,
          date: new Date(),
          invoiceId: invoice._id,
          invoiceRef: invoice.referenceNumber,
          description: `تعديل ${invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${invoice.name}`,
          reason,
          performedBy: req.user.userId,
        });

        invoice.value = newValue;
      }
    }

    if (name !== undefined && name !== invoice.name) {
      editHistory.push({
        field: 'name',
        oldValue: invoice.name,
        newValue: name,
        reason,
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
          reason,
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
        reason,
        editedAt: new Date(),
        editedBy: req.user.userId,
      });
      invoice.details = details;
    }

    if (invoice.ledger === 'bank' && bankReference !== undefined && bankReference !== invoice.bankReference) {
      editHistory.push({
        field: 'bankReference',
        oldValue: invoice.bankReference,
        newValue: bankReference,
        reason,
        editedAt: new Date(),
        editedBy: req.user.userId,
      });
      invoice.bankReference = bankReference;
    }

    if (req.file) {
      if (invoice.document && invoice.document.filePath) {
        const oldPath = path.join(uploadDir, invoice.document.filePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      editHistory.push({
        field: 'document',
        oldValue: invoice.document ? invoice.document.name : null,
        newValue: req.file.originalname,
        reason,
        editedAt: new Date(),
        editedBy: req.user.userId,
      });
      invoice.document = {
        name: req.file.originalname,
        filePath: req.file.filename,
      };
    }

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

// Delete invoice (soft delete)
router.delete('/invoices/:id', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'سبب الحذف مطلوب' });

    const invoice = await FursatkumInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    if (invoice.status === 'deleted') return res.status(400).json({ message: 'الفاتورة محذوفة بالفعل' });

    const account = await FursatkumAccount.getAccount();
    const ledgerField = getLedgerField(invoice.ledger);

    if (invoice.type === 'income') {
      account[ledgerField] -= invoice.value;
      if (account[ledgerField] < 0) account[ledgerField] = 0;
    } else {
      account[ledgerField] += invoice.value;
    }

    await account.save();

    await FursatkumTransaction.create({
      type: `${invoice.type}_reversal`,
      ledger: invoice.ledger,
      amount: invoice.type === 'income' ? -invoice.value : invoice.value,
      balanceAfter: account[ledgerField],
      date: new Date(),
      invoiceId: invoice._id,
      invoiceRef: invoice.referenceNumber,
      description: `حذف ${invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${invoice.name}`,
      reason,
      performedBy: req.user.userId,
    });

    invoice.status = 'deleted';
    invoice.deletedAt = new Date();
    invoice.deletedBy = req.user.userId;
    invoice.deleteReason = reason;
    await invoice.save();

    res.json({ message: 'تم حذف الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الفاتورة', error: error.message });
  }
});

// ==================== ACCOUNTING ====================
router.get('/accounting', async (req, res) => {
  try {
    const account = await FursatkumAccount.getAccount();

    const [incomeAgg, spendingAgg, transactions] = await Promise.all([
      FursatkumInvoice.aggregate([
        { $match: { type: 'income', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
      FursatkumInvoice.aggregate([
        { $match: { type: 'spending', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
      FursatkumTransaction.find()
        .sort({ date: -1 })
        .limit(100)
        .populate('performedBy', 'username'),
    ]);

    const totalIncome = incomeAgg.length ? incomeAgg[0].total : 0;
    const totalSpendings = spendingAgg.length ? spendingAgg[0].total : 0;

    res.json({
      bankBalance: account.bankBalance,
      cashBalance: account.cashBalance,
      bankInfo: account.bankInfo,
      totalIncome,
      totalSpendings,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المحاسبة', error: error.message });
  }
});

// Transactions listing
router.get('/transactions', async (req, res) => {
  try {
    const { ledger, type, page = 1, limit = 50, startDate, endDate } = req.query;
    const filters = {};
    if (ledger && ledger !== 'all') filters.ledger = ledger;
    if (type && type !== 'all') filters.type = type;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      FursatkumTransaction.find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('performedBy', 'username'),
      FursatkumTransaction.countDocuments(filters),
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



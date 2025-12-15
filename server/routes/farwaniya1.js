const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const FW1Invoice = require('../models/FW1Invoice');
const FW1Transaction = require('../models/FW1Transaction');
const FW1Account = require('../models/FW1Account');

const router = express.Router();

// ============ MIDDLEWARE ============
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

function requireFarwaniya1Access(req, res, next) {
  const allowedRoles = ['admin', 'farwaniya1_user'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'غير مصرح بالوصول لهذا القسم' });
  }
  return next();
}

router.use(requireAuth);
router.use(requireFarwaniya1Access);

// ============ FILE UPLOAD ============
const uploadDir = path.join(__dirname, '../uploads/farwaniya1');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `fw1-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// ============ DASHBOARD ============
router.get('/dashboard', async (req, res) => {
  try {
    const account = await FW1Account.getAccount();
    const recentTransactions = await FW1Transaction.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('performedBy', 'username');

    const [incomeCount, spendingCount, deletedCount] = await Promise.all([
      FW1Invoice.countDocuments({ type: 'income', status: 'active' }),
      FW1Invoice.countDocuments({ type: 'spending', status: 'active' }),
      FW1Invoice.countDocuments({ status: 'deleted' }),
    ]);

    res.json({
      balance: account.balance,
      incomeTotal: account.incomeTotal,
      spendingTotal: account.spendingTotal,
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

// ============ INVOICES ============
router.get('/invoices', async (req, res) => {
  try {
    const { type, status = 'active', page = 1, limit = 50, search } = req.query;

    const filters = { status };
    if (type && type !== 'all') filters.type = type;
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
      FW1Invoice.find(filters)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username')
        .populate('deletedBy', 'username')
        .populate('editHistory.editedBy', 'username'),
      FW1Invoice.countDocuments(filters),
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

router.get('/deleted', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      FW1Invoice.find({ status: 'deleted' })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username')
        .populate('deletedBy', 'username'),
      FW1Invoice.countDocuments({ status: 'deleted' }),
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

router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await FW1Invoice.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('deletedBy', 'username')
      .populate('editHistory.editedBy', 'username');

    if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الفاتورة', error: error.message });
  }
});

router.post('/invoices', upload.single('document'), async (req, res) => {
  try {
    const { type, name, value, date, details } = req.body;
    if (!type || !name || !value || !date) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    if (!['income', 'spending'].includes(type)) {
      return res.status(400).json({ message: 'نوع الفاتورة غير صالح' });
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ message: 'قيمة الفاتورة غير صالحة' });
    }

    const account = await FW1Account.getAccount();
    const referenceNumber = await FW1Account.getNextReference(type);

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

    const invoice = new FW1Invoice(invoiceData);
    await invoice.save();

    if (type === 'income') {
      account.balance += numValue;
      account.incomeTotal += numValue;
    } else {
      account.balance -= numValue;
      account.spendingTotal += numValue;
    }
    await account.save();

    await FW1Transaction.create({
      type,
      amount: type === 'income' ? numValue : -numValue,
      balanceAfter: account.balance,
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

router.put('/invoices/:id', upload.single('document'), async (req, res) => {
  try {
    const invoice = await FW1Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    if (invoice.status === 'deleted') return res.status(400).json({ message: 'لا يمكن تعديل فاتورة محذوفة' });

    const { name, value, date, details } = req.body;
    const editHistory = [];
    const account = await FW1Account.getAccount();

    if (value !== undefined) {
      const newValue = parseFloat(value);
      if (isNaN(newValue) || newValue <= 0) {
        return res.status(400).json({ message: 'قيمة الفاتورة غير صالحة' });
      }
      const difference = newValue - invoice.value;
      if (difference !== 0) {
        editHistory.push({
          field: 'value',
          oldValue: invoice.value,
          newValue,
          editedAt: new Date(),
          editedBy: req.user.userId,
        });

        if (invoice.type === 'income') {
          account.balance += difference;
          account.incomeTotal += difference;
        } else {
          account.balance -= difference;
          account.spendingTotal += difference;
        }
        await account.save();

        await FW1Transaction.create({
          type: `${invoice.type}_adjustment`,
          amount: invoice.type === 'income' ? difference : -difference,
          balanceAfter: account.balance,
          date: new Date(),
          invoiceId: invoice._id,
          invoiceRef: invoice.referenceNumber,
          description: `تعديل قيمة ${invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${invoice.name} (${invoice.value} → ${newValue})`,
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

    if (req.file) {
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

router.delete('/invoices/:id', async (req, res) => {
  try {
    const invoice = await FW1Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    if (invoice.status === 'deleted') return res.status(400).json({ message: 'الفاتورة محذوفة بالفعل' });

    const account = await FW1Account.getAccount();

    if (invoice.type === 'income') {
      account.balance -= invoice.value;
      account.incomeTotal = Math.max(0, account.incomeTotal - invoice.value);
    } else {
      account.balance += invoice.value;
      account.spendingTotal = Math.max(0, account.spendingTotal - invoice.value);
    }
    await account.save();

    await FW1Transaction.create({
      type: `${invoice.type}_reversal`,
      amount: invoice.type === 'income' ? -invoice.value : invoice.value,
      balanceAfter: account.balance,
      date: new Date(),
      invoiceId: invoice._id,
      invoiceRef: invoice.referenceNumber,
      description: `حذف ${invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${invoice.name}`,
      performedBy: req.user.userId,
    });

    invoice.status = 'deleted';
    invoice.deletedAt = new Date();
    invoice.deletedBy = req.user.userId;
    await invoice.save();

    res.json({ message: 'تم حذف الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الفاتورة', error: error.message });
  }
});

// ============ ACCOUNTING ============
router.get('/accounting', async (req, res) => {
  try {
    const account = await FW1Account.getAccount();
    const transactions = await FW1Transaction.find()
      .sort({ date: -1 })
      .limit(200)
      .populate('performedBy', 'username');

    res.json({
      balance: account.balance,
      incomeTotal: account.incomeTotal,
      spendingTotal: account.spendingTotal,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المحاسبة', error: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      FW1Transaction.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('performedBy', 'username'),
      FW1Transaction.countDocuments(),
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


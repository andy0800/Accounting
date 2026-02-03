const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const FursatkumInvoice = require('../models/FursatkumInvoice');
const FursatkumTransaction = require('../models/FursatkumTransaction');
const FursatkumAccount = require('../models/FursatkumAccount');
const FursatkumEmployeeLoan = require('../models/FursatkumEmployeeLoan');
const FursatkumSalaryPayment = require('../models/FursatkumSalaryPayment');
const FursatkumEmployee = require('../models/FursatkumEmployee');

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

// Helper to extract user id from JWT payload
const getUserId = (req) => req.user?.userId || req.user?.sub || req.user?.id;

// Helper to get valid ObjectId for createdBy (handles hardcoded 'admin' case)
const getValidCreatedBy = (req) => {
  const userId = getUserId(req);
  if (!userId) return undefined;
  // Check if it's a valid ObjectId string (24 hex characters)
  if (mongoose.Types.ObjectId.isValid(userId) && userId !== 'admin') {
    return userId;
  }
  return undefined; // Return undefined for hardcoded admin or invalid IDs
};

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
      createdBy: getUserId(req),
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
      performedBy: getUserId(req),
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
          editedBy: getUserId(req),
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
          performedBy: getUserId(req),
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
        editedBy: getUserId(req),
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
        editedBy: getUserId(req),
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
        editedBy: getUserId(req),
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
        editedBy: getUserId(req),
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
        editedBy: getUserId(req),
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
      performedBy: getUserId(req),
    });

    invoice.status = 'deleted';
    invoice.deletedAt = new Date();
    invoice.deletedBy = getUserId(req);
    invoice.deleteReason = reason;
    await invoice.save();

    res.json({ message: 'تم حذف الفاتورة بنجاح', invoice });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الفاتورة', error: error.message });
  }
});

// ==================== EMPLOYEE LOANS & SALARIES ====================

// Employees
router.get('/employees', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 50, search } = req.query;
    const filters = { status };
    if (search) {
      const regex = new RegExp(search, 'i');
      filters.name = regex;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [employees, total] = await Promise.all([
      FursatkumEmployee.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      FursatkumEmployee.countDocuments(filters),
    ]);

    res.json({
      employees,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الموظفين', error: error.message });
  }
});

router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await FursatkumEmployee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'الموظف غير موجود' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الموظف', error: error.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const { name, monthlySalary, status, notes } = req.body;
    if (!name || monthlySalary === undefined) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    const salaryValue = parseFloat(monthlySalary);
    if (isNaN(salaryValue) || salaryValue <= 0) {
      return res.status(400).json({ message: 'قيمة الراتب غير صالحة' });
    }

    const employeeData = {
      name,
      monthlySalary: salaryValue,
      status: status || 'active',
      notes,
    };
    const validCreatedBy = getValidCreatedBy(req);
    if (validCreatedBy) {
      employeeData.createdBy = validCreatedBy;
    }
    const employee = new FursatkumEmployee(employeeData);
    await employee.save();
    res.status(201).json({ message: 'تم إنشاء الموظف بنجاح', employee });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء الموظف', error: error.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const { name, monthlySalary, status, notes } = req.body;
    const employee = await FursatkumEmployee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'الموظف غير موجود' });

    if (name !== undefined) employee.name = name;
    if (monthlySalary !== undefined) {
      const salaryValue = parseFloat(monthlySalary);
      if (isNaN(salaryValue) || salaryValue <= 0) {
        return res.status(400).json({ message: 'قيمة الراتب غير صالحة' });
      }
      employee.monthlySalary = salaryValue;
    }
    if (status !== undefined) employee.status = status;
    if (notes !== undefined) employee.notes = notes;

    await employee.save();
    res.json({ message: 'تم تحديث الموظف بنجاح', employee });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث الموظف', error: error.message });
  }
});

// List employee loans
router.get('/employee-loans', async (req, res) => {
  try {
    const { employeeId, status, page = 1, limit = 50 } = req.query;
    const filters = {};
    if (employeeId) filters.employeeId = employeeId;
    if (status) filters.status = status;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [loans, total] = await Promise.all([
      FursatkumEmployeeLoan.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('employeeId', 'name')
        .populate('createdBy', 'username'),
      FursatkumEmployeeLoan.countDocuments(filters),
    ]);

    res.json({
      loans,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب القروض', error: error.message });
  }
});

router.get('/employee-loans/summary', async (req, res) => {
  try {
    const [sumAgg, count] = await Promise.all([
      FursatkumEmployeeLoan.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
      ]),
      FursatkumEmployeeLoan.countDocuments({ status: 'active' }),
    ]);
    const outstandingTotal = sumAgg.length ? sumAgg[0].total : 0;
    res.json({ outstandingTotal, activeCount: count });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب ملخص القروض', error: error.message });
  }
});

// Single loan
router.get('/employee-loans/:id', async (req, res) => {
  try {
    const loan = await FursatkumEmployeeLoan.findById(req.params.id)
      .populate('employeeId', 'name')
      .populate('createdBy', 'username');
    if (!loan) return res.status(404).json({ message: 'القرض غير موجود' });
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب القرض', error: error.message });
  }
});

// List salary payments
router.get('/salaries', async (req, res) => {
  try {
    const { employeeId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filters = {};
    if (employeeId) filters.employeeId = employeeId;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNumber - 1) * pageSize;

    const [salaries, total] = await Promise.all([
      FursatkumSalaryPayment.find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('employeeId', 'name')
        .populate('createdBy', 'username'),
      FursatkumSalaryPayment.countDocuments(filters),
    ]);

    res.json({
      salaries,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الرواتب', error: error.message });
  }
});

router.get('/salaries/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filters = {};
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const [netAgg, grossAgg] = await Promise.all([
      FursatkumSalaryPayment.aggregate([
        { $match: filters },
        { $group: { _id: null, total: { $sum: '$netPaid' } } },
      ]),
      FursatkumSalaryPayment.aggregate([
        { $match: filters },
        { $group: { _id: null, total: { $sum: '$grossSalary' } } },
      ]),
    ]);
    const netTotal = netAgg.length ? netAgg[0].total : 0;
    const grossTotal = grossAgg.length ? grossAgg[0].total : 0;
    res.json({ netTotal, grossTotal });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب ملخص الرواتب', error: error.message });
  }
});

router.post('/employee-loans', async (req, res) => {
  try {
    const { employeeId, amount, ledger, monthlyDeduction, description } = req.body;

    if (!employeeId || amount === undefined || !ledger) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    if (!['cash', 'bank'].includes(ledger)) {
      return res.status(400).json({ message: 'مصدر/وجهة غير صالحة' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'قيمة القرض غير صالحة' });
    }

    let numMonthlyDeduction;
    if (monthlyDeduction !== undefined && monthlyDeduction !== null && monthlyDeduction !== '') {
      numMonthlyDeduction = parseFloat(monthlyDeduction);
      if (isNaN(numMonthlyDeduction) || numMonthlyDeduction < 0) {
        return res.status(400).json({ message: 'قيمة الخصم الشهري غير صالحة' });
      }
    }

    const employee = await FursatkumEmployee.findById(employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'الموظف غير موجود' });
    }

    const account = await FursatkumAccount.getAccount();
    const ledgerField = getLedgerField(ledger);

    if (numAmount > account[ledgerField]) {
      return res.status(400).json({
        message: 'الرصيد غير كافٍ في المصدر المحدد',
        available: account[ledgerField],
        required: numAmount,
      });
    }

    account[ledgerField] -= numAmount;

    const referenceNumber = await FursatkumAccount.getNextReference('loan');

    const loanData = {
      employeeId,
      referenceNumber,
      originalAmount: numAmount,
      remainingAmount: numAmount,
      monthlyDeduction: numMonthlyDeduction,
      description,
    };
    const validCreatedByLoan = getValidCreatedBy(req);
    if (validCreatedByLoan) {
      loanData.createdBy = validCreatedByLoan;
    }
    const loan = new FursatkumEmployeeLoan(loanData);

    await loan.save();
    await account.save();

    await FursatkumTransaction.create({
      type: 'employee_loan_given',
      ledger,
      amount: -numAmount,
      balanceAfter: account[ledgerField],
      date: new Date(),
      description: `صرف قرض موظف (${referenceNumber})`,
      performedBy: getUserId(req),
    });

    res.status(201).json({ message: 'تم إنشاء قرض الموظف بنجاح', loan });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء قرض الموظف', error: error.message });
  }
});

router.post('/employee-loans/:id/repay', async (req, res) => {
  try {
    const { amount, ledger } = req.body;

    if (amount === undefined || !ledger) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    if (!['cash', 'bank'].includes(ledger)) {
      return res.status(400).json({ message: 'مصدر/وجهة غير صالحة' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'قيمة السداد غير صالحة' });
    }

    const loan = await FursatkumEmployeeLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'القرض غير موجود' });
    if (loan.status !== 'active') {
      return res.status(400).json({ message: 'لا يمكن سداد قرض غير نشط' });
    }
    if (numAmount > loan.remainingAmount) {
      return res.status(400).json({ message: 'قيمة السداد أكبر من المتبقي' });
    }

    const account = await FursatkumAccount.getAccount();
    const ledgerField = getLedgerField(ledger);

    account[ledgerField] += numAmount;
    loan.remainingAmount -= numAmount;
    if (loan.remainingAmount <= 0) {
      loan.remainingAmount = 0;
      loan.status = 'paid';
    }

    await loan.save();
    await account.save();

    await FursatkumTransaction.create({
      type: 'employee_loan_repayment',
      ledger,
      amount: numAmount,
      balanceAfter: account[ledgerField],
      date: new Date(),
      description: `سداد قرض موظف (${loan.referenceNumber})`,
      performedBy: getUserId(req),
    });

    res.json({ message: 'تم سداد القرض بنجاح', loan });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في سداد القرض', error: error.message });
  }
});

router.post('/salaries/pay', async (req, res) => {
  try {
    const { employeeId, grossSalary, ledger, date } = req.body;

    if (!employeeId || grossSalary === undefined || !ledger || !date) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    if (!['cash', 'bank'].includes(ledger)) {
      return res.status(400).json({ message: 'مصدر/وجهة غير صالحة' });
    }

    const numGrossSalary = parseFloat(grossSalary);
    if (isNaN(numGrossSalary) || numGrossSalary <= 0) {
      return res.status(400).json({ message: 'قيمة الراتب غير صالحة' });
    }

    const employee = await FursatkumEmployee.findById(employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'الموظف غير موجود' });
    }

    const account = await FursatkumAccount.getAccount();
    const ledgerField = getLedgerField(ledger);

    const activeLoans = await FursatkumEmployeeLoan.find({ employeeId, status: 'active' }).sort({ createdAt: 1 });
    let deduction = 0;
    const loanAdjustments = [];
    let remainingSalary = numGrossSalary;
    for (const loan of activeLoans) {
      if (remainingSalary <= 0) break;
      const planned = loan.monthlyDeduction !== undefined && loan.monthlyDeduction !== null
        ? loan.monthlyDeduction
        : loan.remainingAmount;
      const applied = Math.min(planned, loan.remainingAmount, remainingSalary);
      if (applied > 0) {
        deduction += applied;
        remainingSalary -= applied;
        loanAdjustments.push({ loan, applied });
      }
    }

    const netPaid = numGrossSalary - deduction;
    if (netPaid > account[ledgerField]) {
      return res.status(400).json({
        message: 'الرصيد غير كافٍ في المصدر المحدد',
        available: account[ledgerField],
        required: netPaid,
      });
    }

    account[ledgerField] -= netPaid;

    const referenceNumber = await FursatkumAccount.getNextReference('salary');

    const salaryData = {
      employeeId,
      referenceNumber,
      grossSalary: numGrossSalary,
      loanDeducted: deduction,
      netPaid,
      ledger,
      date: new Date(date),
    };
    const validCreatedBySalary = getValidCreatedBy(req);
    if (validCreatedBySalary) {
      salaryData.createdBy = validCreatedBySalary;
    }
    const salary = new FursatkumSalaryPayment(salaryData);

    await salary.save();

    await FursatkumTransaction.create({
      type: 'salary_payment',
      ledger,
      amount: -netPaid,
      balanceAfter: account[ledgerField],
      date: new Date(date),
      description: `صرف راتب (${referenceNumber})`,
      performedBy: getUserId(req),
    });

    if (loanAdjustments.length > 0) {
      const refs = [];
      for (const entry of loanAdjustments) {
        entry.loan.remainingAmount -= entry.applied;
        if (entry.loan.remainingAmount <= 0) {
          entry.loan.remainingAmount = 0;
          entry.loan.status = 'paid';
        }
        await entry.loan.save();
        refs.push(entry.loan.referenceNumber);
      }

      await FursatkumTransaction.create({
        type: 'salary_loan_deduction',
        ledger,
        amount: 0,
        balanceAfter: account[ledgerField],
        date: new Date(date),
        description: `خصم قروض (${refs.join(', ')}) من راتب (${referenceNumber})`,
        performedBy: getUserId(req),
      });
    }

    await account.save();

    res.status(201).json({ message: 'تم صرف الراتب بنجاح', salary });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في صرف الراتب', error: error.message });
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



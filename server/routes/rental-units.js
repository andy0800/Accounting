const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RentalUnit = require('../models/RentalUnit');
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

const uploadDir = path.join(__dirname, '../uploads/rental-units');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `unit-${uniqueSuffix}${path.extname(file.originalname)}`);
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

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: 'i' } },
        { unitType: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }
    const units = await RentalUnit.find(query)
      .populate('currentContract', 'referenceNumber status rentAmount startDate durationMonths');
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الوحدات', error: error.message });
  }
});

router.get('/available/list', async (req, res) => {
  try {
    const units = await RentalUnit.find({ status: 'متاح' }).sort({ unitNumber: 1 });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الوحدات المتاحة', error: error.message });
  }
});

router.get('/:id/details', async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id)
      .populate({
        path: 'currentContract',
        populate: [
          { path: 'rentalSecretaryId', select: 'name phone email' },
        ],
      });
    if (!unit) return res.status(404).json({ message: 'الوحدة غير موجودة' });

    let contractDetails = null;
    if (unit.currentContract) {
      contractDetails = await RentalContract.findById(unit.currentContract._id)
        .populate('rentalSecretaryId', 'name phone email');
    }

    res.json({
      unit,
      contract: contractDetails,
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب تفاصيل الوحدة', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { unitType, unitNumber, address, rentAmount, status, notes } = req.body;
    if (!unitType || !unitNumber || !address || !rentAmount) {
      return res.status(400).json({ message: 'الحقول الأساسية مطلوبة' });
    }
    const unit = new RentalUnit({
      unitType,
      unitNumber,
      address,
      rentAmount,
      status,
      notes,
    });
    await unit.save();
    res.status(201).json({ message: 'تم إنشاء الوحدة', unit });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء الوحدة', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'الوحدة غير موجودة' });

    const fields = ['unitType', 'unitNumber', 'address', 'rentAmount', 'status', 'notes'];
    fields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        unit[field] = req.body[field];
      }
    });

    await unit.save();
    res.json({ message: 'تم تحديث الوحدة', unit });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث الوحدة', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'الوحدة غير موجودة' });
    if (unit.status === 'نشط' || unit.currentContract) {
      return res.status(400).json({ message: 'لا يمكن حذف وحدة مرتبطة بعقد نشط' });
    }
    await RentalUnit.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف الوحدة' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الوحدة', error: error.message });
  }
});

router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'الوحدة غير موجودة' });
    if (!req.file) return res.status(400).json({ message: 'الملف مطلوب' });

    unit.attachments = unit.attachments || [];
    unit.attachments.push({
      name: req.file.originalname,
      filePath: req.file.filename,
    });

    await unit.save();
    res.json({ message: 'تم رفع الملف', attachments: unit.attachments });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في رفع الملف', error: error.message });
  }
});

router.delete('/:id/attachments/:fileName', async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const unit = await RentalUnit.findById(id);
    if (!unit) return res.status(404).json({ message: 'الوحدة غير موجودة' });

    unit.attachments = (unit.attachments || []).filter((att) => att.filePath !== fileName);
    await unit.save();

    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'تم حذف الملف', attachments: unit.attachments });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الملف', error: error.message });
  }
});

module.exports = router;


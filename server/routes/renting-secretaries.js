const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const uploadDir = path.join(__dirname, '../uploads/rental-secretaries');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `secretary-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const secretaries = await RentingSecretary.find(query).sort({ createdAt: -1 });
    res.json(secretaries);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب السكرتارية', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const secretary = await RentingSecretary.findById(req.params.id);
    if (!secretary) return res.status(404).json({ message: 'السكرتير غير موجود' });
    res.json(secretary);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات السكرتير', error: error.message });
  }
});

router.post('/', upload.array('documents', 5), async (req, res) => {
  try {
    const { name, phone, email, address, idNumber, status, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'الاسم ورقم الهاتف مطلوبان' });
    }

    const documents = (req.files || []).map((file) => ({
      name: file.originalname,
      filePath: file.filename,
    }));

    const secretary = new RentingSecretary({
      name,
      phone,
      email,
      address,
      idNumber,
      status,
      notes,
      documents,
    });

    await secretary.save();
    res.status(201).json({ message: 'تم إنشاء السكرتير', secretary });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء السكرتير', error: error.message });
  }
});

router.put('/:id', upload.array('documents', 5), async (req, res) => {
  try {
    const secretary = await RentingSecretary.findById(req.params.id);
    if (!secretary) return res.status(404).json({ message: 'السكرتير غير موجود' });

    const fields = ['name', 'phone', 'email', 'address', 'idNumber', 'status', 'notes'];
    fields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        secretary[field] = req.body[field];
      }
    });

    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        name: file.originalname,
        filePath: file.filename,
      }));
      secretary.documents = [...(secretary.documents || []), ...newDocs];
    }

    await secretary.save();
    res.json({ message: 'تم تحديث بيانات السكرتير', secretary });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث بيانات السكرتير', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const secretary = await RentingSecretary.findByIdAndDelete(req.params.id);
    if (!secretary) return res.status(404).json({ message: 'السكرتير غير موجود' });
    res.json({ message: 'تم حذف السكرتير' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف السكرتير', error: error.message });
  }
});

router.delete('/:id/documents/:fileName', async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const secretary = await RentingSecretary.findById(id);
    if (!secretary) return res.status(404).json({ message: 'السكرتير غير موجود' });

    secretary.documents = (secretary.documents || []).filter((doc) => doc.filePath !== fileName);
    await secretary.save();

    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'تم حذف الملف' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الملف', error: error.message });
  }
});

module.exports = router;


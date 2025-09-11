const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RentingSecretary = require('../models/RentingSecretary');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/secretaries');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Get all renting secretaries
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const secretaries = await RentingSecretary.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await RentingSecretary.countDocuments(query);
    
    res.json({
      secretaries,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات السكرتارية', error: error.message });
  }
});

// Get single renting secretary
router.get('/:id', async (req, res) => {
  try {
    const secretary = await RentingSecretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }
    res.json(secretary);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات السكرتير', error: error.message });
  }
});

// Create new renting secretary
router.post('/', upload.array('documents', 5), async (req, res) => {
  try {
    const { name, phone, email, address, idNumber, notes } = req.body;
    
    // Check if secretary already exists
    const existingSecretary = await RentingSecretary.findOne({ 
      $or: [{ phone }, { email: email || '' }] 
    });
    
    if (existingSecretary) {
      return res.status(400).json({ message: 'السكرتير موجود مسبقاً' });
    }
    
    // Process uploaded documents
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          filePath: file.filename,
          uploadDate: new Date()
        });
      });
    }
    
    const secretary = new RentingSecretary({
      name,
      phone,
      email,
      address,
      idNumber,
      documents,
      notes
    });
    
    await secretary.save();
    res.status(201).json({ 
      message: 'تم إنشاء السكرتير بنجاح',
      secretary 
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في إنشاء السكرتير', error: error.message });
  }
});

// Update renting secretary
router.put('/:id', upload.array('documents', 5), async (req, res) => {
  try {
    const { name, phone, email, address, idNumber, notes, status } = req.body;
    
    const secretary = await RentingSecretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }
    
    // Check if phone/email already exists for other secretaries
    if (phone && phone !== secretary.phone) {
      const existingPhone = await RentingSecretary.findOne({ 
        phone, 
        _id: { $ne: req.params.id } 
      });
      if (existingPhone) {
        return res.status(400).json({ message: 'رقم الهاتف مستخدم من قبل سكرتير آخر' });
      }
    }
    
    if (email && email !== secretary.email) {
      const existingEmail = await RentingSecretary.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'البريد الإلكتروني مستخدم من قبل سكرتير آخر' });
      }
    }
    
    // Process new documents
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        secretary.documents.push({
          name: file.originalname,
          filePath: file.filename,
          uploadDate: new Date()
        });
      });
    }
    
    // Update fields
    secretary.name = name || secretary.name;
    secretary.phone = phone || secretary.phone;
    secretary.email = email || secretary.email;
    secretary.address = address || secretary.address;
    secretary.idNumber = idNumber || secretary.idNumber;
    secretary.notes = notes || secretary.notes;
    secretary.status = status || secretary.status;
    
    await secretary.save();
    res.json({ 
      message: 'تم تحديث بيانات السكرتير بنجاح',
      secretary 
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث بيانات السكرتير', error: error.message });
  }
});

// Delete renting secretary
router.delete('/:id', async (req, res) => {
  try {
    const secretary = await RentingSecretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }
    
    // Check if secretary has active contracts
    // This will be implemented when we create the contracts model
    
    await RentingSecretary.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم حذف السكرتير بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف السكرتير', error: error.message });
  }
});

// Remove document from secretary
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const secretary = await RentingSecretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتير غير موجود' });
    }
    
    const document = secretary.documents.id(req.params.docId);
    if (!document) {
      return res.status(404).json({ message: 'المستند غير موجود' });
    }
    
    // Remove file from storage
    const filePath = path.join(__dirname, '../uploads/secretaries', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    document.remove();
    await secretary.save();
    
    res.json({ message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المستند', error: error.message });
  }
});

module.exports = router;

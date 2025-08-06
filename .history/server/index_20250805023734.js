const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://andydaddy080:1s8trWSbR9J8rNkq@cluster0.g5rsvmu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoUri);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'خطأ في الاتصال بقاعدة البيانات:'));
db.once('open', () => {
  console.log('تم الاتصال بقاعدة البيانات بنجاح');
});

// Routes
app.use('/api/secretaries', require('./routes/secretaries'));
app.use('/api/visas', require('./routes/visas'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/exports', require('./routes/exports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // If it's a validation error or has a specific message, use it
  if (err.name === 'ValidationError' || err.message) {
    res.status(400).json({ message: err.message });
  } else {
    res.status(500).json({ message: 'حدث خطأ في النظام!' });
  }
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
}); 
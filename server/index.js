const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not found in environment variables. Using default secret (NOT RECOMMENDED FOR PRODUCTION)');
}

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',           // Development frontend
      'http://localhost:3001',           // Alternative dev port
      'https://your-frontend-domain.com', // Production frontend (replace with actual domain)
      process.env.CORS_ORIGIN,           // From environment variable
      process.env.FRONTEND_URL           // Alternative environment variable
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/secretaries', require('./routes/secretaries'));
app.use('/api/visas', require('./routes/visas'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/exports', require('./routes/exports'));

// Renting System Routes
app.use('/api/renting-secretaries', require('./routes/renting-secretaries'));
app.use('/api/rental-units', require('./routes/rental-units'));
app.use('/api/rental-contracts', require('./routes/rental-contracts'));
app.use('/api/rental-payments', require('./routes/rental-payments'));
app.use('/api/renting-reports', require('./routes/renting-reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // If it's a validation error or has a specific message, use it
  if (err.name === 'ValidationError' || err.message) {
    res.status(400).json({ 
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    res.status(500).json({ 
      message: 'حدث خطأ في النظام!',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
}); 
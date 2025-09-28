const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
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
      'http://localhost:3000',                    // Development frontend
      'http://localhost:3001',                    // Alternative dev port
      'https://fursatkum-frontend.onrender.com',  // Production frontend
      'https://fursatkum-backend.onrender.com',   // Production backend (for internal API calls)
      process.env.CORS_ORIGIN,                    // From environment variable
      process.env.FRONTEND_URL                    // Alternative environment variable
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
app.use(compression()); // Enable gzip compression
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add response caching headers
app.use((req, res, next) => {
  // Cache static assets for 1 hour
  if (req.url.startsWith('/uploads/')) {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  // Cache API responses for 5 minutes
  else if (req.url.startsWith('/api/')) {
    res.set('Cache-Control', 'public, max-age=300');
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with optimization
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://andydaddy080:1s8trWSbR9J8rNkq@cluster0.g5rsvmu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Optimized MongoDB connection options
const mongooseOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(mongoUri, mongooseOptions);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'خطأ في الاتصال بقاعدة البيانات:'));
db.once('open', () => {
  console.log('تم الاتصال بقاعدة البيانات بنجاح');
  console.log('🚀 Database connection optimized for performance');
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
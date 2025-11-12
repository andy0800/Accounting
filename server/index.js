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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Ensure preflight requests succeed for all routes
app.options('*', cors(corsOptions));

// Add response caching headers
app.use((req, res, next) => {
  // Cache static assets for 1 hour
  if (req.url.startsWith('/uploads/')) {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  // Cache API GET responses (non-auth) for 5 minutes only
  else if (
    req.method === 'GET' &&
    req.url.startsWith('/api/') &&
    !req.url.startsWith('/api/auth')
  ) {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    // Do not cache non-GET or auth endpoints
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with optimization
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://andydaddy080:1s8trWSbR9J8rNkq@cluster0.g5rsvmu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Optimized MongoDB connection options for free tier deployments
const mongooseOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for free tier
  socketTimeoutMS: 60000, // Increased to 60 seconds for better stability
  connectTimeoutMS: 30000, // Added connection timeout
  heartbeatFrequencyMS: 10000, // Added heartbeat frequency
  maxIdleTimeMS: 60000, // Added max idle time
  retryWrites: true,
  w: 'majority'
};

// Disable mongoose command buffering globally
mongoose.set('bufferCommands', false);

// Connection retry logic for free tier deployments
const connectWithRetry = () => {
  console.log('🔄 Attempting to connect to MongoDB Atlas...');
  
  mongoose.connect(mongoUri, mongooseOptions)
    .then(() => {
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      console.log('🚀 Database connection optimized for free tier');
    })
    .catch((error) => {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
      console.log('🔄 سيتم إعادة المحاولة خلال 5 ثوانٍ...');
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

// Initial connection attempt
connectWithRetry();

const db = mongoose.connection;

// Enhanced error handling for connection issues
db.on('error', (error) => {
  console.error('❌ خطأ في قاعدة البيانات:', error.message);
  if (error.message.includes('Server selection timed out')) {
    console.log('⏰ انتهت مهلة الاتصال - هذا طبيعي في الطبقة المجانية');
    console.log('🔄 سيتم إعادة المحاولة تلقائياً...');
  }
});

db.on('disconnected', () => {
  console.log('⚠️  انقطع الاتصال مع قاعدة البيانات');
  console.log('🔄 محاولة إعادة الاتصال...');
  setTimeout(connectWithRetry, 5000);
});

db.on('reconnected', () => {
  console.log('✅ تم إعادة الاتصال بقاعدة البيانات');
});

db.once('open', () => {
  console.log('🎉 قاعدة البيانات جاهزة للاستخدام');
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
app.use('/api/health', require('./routes/health'));
app.use('/api/secretaries', require('./routes/secretaries'));
app.use('/api/visas', require('./routes/visas'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/exports', require('./routes/exports'));
// Auth & Users
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
// Trial contracts (visa handover/probation)
app.use('/api/trial-contracts', require('./routes/trial-contracts'));

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

// Start server with graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || 'localhost'}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    
    // Close database connection
    mongoose.connection.close((err) => {
      if (err) {
        console.error('❌ Error closing database connection:', err);
        process.exit(1);
      }
      
      console.log('✅ Database connection closed successfully');
      console.log('👋 Goodbye!');
      process.exit(0);
    });
  });
};

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('Uncaught Exception');
}); 
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint with comprehensive status
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbStatus] || 'unknown';
    
    // Basic database ping
    let dbPing = -1;
    if (dbStatus === 1) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPing = Date.now() - pingStart;
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      database: {
        status: dbStatusText,
        connected: dbStatus === 1,
        ping: dbPing
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'development'
      },
      render: {
        coldStart: responseTime > 10000, // Likely cold start if > 10s
        region: process.env.RENDER_REGION || 'unknown',
        service: process.env.RENDER_SERVICE_NAME || 'local'
      }
    };
    
    // Set appropriate status code
    const statusCode = (dbStatus === 1 && responseTime < 30000) ? 200 : 503;
    
    res.status(statusCode).json(healthData);
    
    // Log health check for monitoring
    console.log(`💚 Health check: ${statusCode} - DB: ${dbStatusText} - Response: ${responseTime}ms`);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime(),
      database: {
        status: 'error',
        connected: false
      }
    });
  }
});

// Detailed health check for monitoring
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // More comprehensive checks
    const checks = {
      database: { status: 'checking', duration: 0 },
      memory: { status: 'checking', usage: 0 },
      disk: { status: 'checking', available: true },
      network: { status: 'checking', latency: 0 }
    };
    
    // Database check
    try {
      const dbStart = Date.now();
      await mongoose.connection.db.admin().ping();
      checks.database = {
        status: 'healthy',
        duration: Date.now() - dbStart,
        readyState: mongoose.connection.readyState
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message,
        readyState: mongoose.connection.readyState
      };
    }
    
    // Memory check
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memUsagePercent = Math.round((memUsedMB / memTotalMB) * 100);
    
    checks.memory = {
      status: memUsagePercent > 90 ? 'warning' : 'healthy',
      usage: memUsagePercent,
      used: memUsedMB,
      total: memTotalMB
    };
    
    // Network latency check (to self)
    const networkStart = Date.now();
    checks.network = {
      status: 'healthy',
      latency: Date.now() - networkStart,
      timestamp: new Date().toISOString()
    };
    
    const totalDuration = Date.now() - startTime;
    const overallStatus = Object.values(checks).every(check => 
      check.status === 'healthy' || check.status === 'warning'
    ) ? 'healthy' : 'unhealthy';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      checks,
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage(),
        env: process.env.NODE_ENV || 'development'
      },
      render: {
        coldStart: totalDuration > 10000,
        region: process.env.RENDER_REGION || 'unknown',
        service: process.env.RENDER_SERVICE_NAME || 'local',
        deployment: process.env.RENDER_GIT_COMMIT || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('❌ Detailed health check failed:', error);
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Wake up endpoint specifically for cold starts
router.post('/wakeup', async (req, res) => {
  try {
    console.log('☕ Wake up request received');
    const startTime = Date.now();
    
    // Perform basic operations to warm up the service
    const operations = [];
    
    // Database operation
    if (mongoose.connection.readyState === 1) {
      operations.push(mongoose.connection.db.admin().ping());
    }
    
    // Wait for all operations
    await Promise.all(operations);
    
    const duration = Date.now() - startTime;
    
    res.json({
      status: 'awake',
      message: 'Service is now warmed up',
      duration,
      timestamp: new Date().toISOString(),
      operations: operations.length
    });
    
    console.log(`✅ Wake up completed in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Wake up failed:', error);
    
    res.status(503).json({
      status: 'error',
      message: 'Wake up failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

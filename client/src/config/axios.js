import axios from 'axios';

// Get API URL from environment variables or use default
const API_URL = process.env.REACT_APP_API_URL || 'https://fursatkum-backend.onrender.com';

// Enhanced configuration for Render free tier with cold start handling
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 90000, // Increased to 90 seconds for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
  // Enhanced retry configuration
  retry: 5, // Increased retry attempts
  retryDelay: (retryCount) => {
    // Progressive backoff: 2s, 4s, 8s, 16s, 32s
    return Math.min(Math.pow(2, retryCount + 1) * 1000, 30000);
  },
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // Increased to 10 minutes for better performance

// Advanced retry logic for Render free tier
const retryRequest = async (config, retryCount = 0) => {
  const maxRetries = config.retry || 5;
  
  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    const shouldRetry = (
      retryCount < maxRetries &&
      (
        error.code === 'ECONNABORTED' || // Timeout
        error.code === 'ENOTFOUND' || // DNS resolution failed
        error.code === 'ECONNRESET' || // Connection reset
        error.code === 'ETIMEDOUT' || // Connection timeout
        (error.response && error.response.status >= 500) || // Server errors
        !error.response // Network errors
      )
    );

    if (shouldRetry) {
      const delay = config.retryDelay ? config.retryDelay(retryCount) : Math.pow(2, retryCount + 1) * 1000;
      
      console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms...`);
      console.log(`📍 URL: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Show user-friendly message for cold starts
      if (error.code === 'ECONNABORTED' && retryCount === 0) {
        console.log('❄️ Backend is cold starting (Render free tier) - this may take up to 2 minutes');
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }
    
    throw error;
  }
};

// Wake up backend function
const wakeUpBackend = async () => {
  try {
    console.log('☕ Attempting to wake up backend...');
    const response = await axios.get(`${API_URL}/api/health`, { 
      timeout: 120000, // 2 minutes for wake up
      validateStatus: () => true // Accept any status
    });
    
    if (response.status === 200) {
      console.log('✅ Backend is awake and ready');
      return true;
    } else {
      console.log('⚠️ Backend responded but may not be fully ready');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to wake up backend:', error.message);
    return false;
  }
};

// Request interceptor with cache check
apiClient.interceptors.request.use(
  (config) => {
    // Check cache for GET requests
    if (config.method === 'get') {
      const cacheKey = config.url;
      const cached = cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`📦 Cache hit: ${config.url}`);
        return Promise.resolve({
          ...config,
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    }
    
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    
    // Cache GET requests for 10 minutes
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = response.config.url;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      console.log(`💾 Cached response: ${cacheKey}`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite retry loops
    if (originalRequest._retry) {
      console.error('❌ Final Response Error:', error.response?.status, error.message);
      return Promise.reject(error);
    }
    
    // Mark request as retried
    originalRequest._retry = true;
    
    console.error('❌ Response Error:', error.response?.status, error.message);
    
    // Enhanced error handling with retry logic
    const shouldRetry = (
      !originalRequest._retryCount || originalRequest._retryCount < 5
    ) && (
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ENOTFOUND' || // DNS resolution failed
      error.code === 'ECONNRESET' || // Connection reset
      error.code === 'ETIMEDOUT' || // Connection timeout
      (error.response && error.response.status >= 500) || // Server errors
      !error.response // Network errors
    );

    if (shouldRetry) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.min(Math.pow(2, originalRequest._retryCount) * 1000, 30000);
      
      console.log(`🔄 Auto-retry ${originalRequest._retryCount}/5 after ${delay}ms...`);
      
      // Show specific messages for different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('❄️ Backend cold start detected - waiting for warmup...');
        
        // Try to wake up backend on first timeout
        if (originalRequest._retryCount === 1) {
          console.log('☕ Attempting to wake up backend...');
          await wakeUpBackend();
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with increased timeout
      originalRequest.timeout = Math.min((originalRequest.timeout || 90000) * 1.5, 180000);
      
      return apiClient(originalRequest);
    }
    
    // Handle specific error cases after retries failed
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized access - redirect to login');
    } else if (error.response?.status === 403) {
      console.warn('🚫 Forbidden access');
    } else if (error.response?.status >= 500) {
      console.error('🔥 Server error after retries:', error.response.data);
    } else if (!error.response) {
      console.error('🌐 Network error - Backend unreachable after retries');
      console.error('💡 This is common on Render free tier - backend may be sleeping');
    }
    
    return Promise.reject(error);
  }
);

// Export additional utilities
export { wakeUpBackend, cache };
export default apiClient;

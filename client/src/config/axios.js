import axios from 'axios';

// Get API URL from environment variables or use default
const API_URL = process.env.REACT_APP_API_URL || 'https://fursatkum-backend.onrender.com';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for Render free tier
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

// Response interceptor with caching
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    
    // Cache GET requests for 5 minutes
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = response.config.url;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏰ Request timeout - Backend may be sleeping (Render free tier)');
      console.error('💡 Consider upgrading to paid tier or implementing retry logic');
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('🔒 Unauthorized access - redirect to login');
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.warn('🚫 Forbidden access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('🔥 Server error:', error.response.data);
    } else if (!error.response) {
      // Network error or server down
      console.error('🌐 Network error - Backend may be down or unreachable');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

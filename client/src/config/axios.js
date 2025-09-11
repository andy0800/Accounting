import axios from 'axios';

// Get API URL from environment variables or use default
const API_URL = process.env.REACT_APP_API_URL || 'https://fursatkum-backend.onrender.com';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    
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
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

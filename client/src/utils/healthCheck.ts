import apiClient from '../config/axios';

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export const waitForBackend = async (maxAttempts = 5): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔍 Checking backend health (attempt ${attempt}/${maxAttempts})...`);
    
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      console.log('✅ Backend is healthy and ready!');
      return true;
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Backend not ready, waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.error('❌ Backend health check failed after all attempts');
  return false;
};

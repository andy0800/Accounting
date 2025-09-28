import apiClient from '../config/axios';

class BackendPreloader {
  private static instance: BackendPreloader;
  private preloadPromise: Promise<boolean> | null = null;
  private lastPreloadTime = 0;
  private readonly PRELOAD_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): BackendPreloader {
    if (!BackendPreloader.instance) {
      BackendPreloader.instance = new BackendPreloader();
    }
    return BackendPreloader.instance;
  }

  async preloadBackend(): Promise<boolean> {
    const now = Date.now();
    
    // Don't preload if we already did it recently
    if (this.preloadPromise && (now - this.lastPreloadTime) < this.PRELOAD_INTERVAL) {
      return this.preloadPromise;
    }

    this.preloadPromise = this.performPreload();
    this.lastPreloadTime = now;
    
    return this.preloadPromise;
  }

  private async performPreload(): Promise<boolean> {
    try {
      console.log('🔥 Preloading backend to prevent cold starts...');
      
      // Make a lightweight health check request
      const response = await apiClient.get('/api/health', { 
        timeout: 15000 // Shorter timeout for preload
      });
      
      if (response.status === 200) {
        console.log('✅ Backend preloaded successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Backend preload failed:', error);
      return false;
    }
  }

  // Call this when user first visits the site
  async warmUpBackend(): Promise<void> {
    // Don't wait for it, just start the preload in background
    this.preloadBackend().catch(() => {
      // Ignore preload errors, they're not critical
    });
  }
}

export const backendPreloader = BackendPreloader.getInstance();

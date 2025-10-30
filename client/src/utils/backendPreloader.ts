import apiClient from '../config/axios';

class BackendPreloader {
  private static instance: BackendPreloader;
  private preloadPromise: Promise<boolean> | null = null;
  private lastPreloadTime = 0;
  private isWarmedUp = false;
  private consecutiveFailures = 0;
  private readonly PRELOAD_INTERVAL = 3 * 60 * 1000; // Reduced to 3 minutes
  private readonly MAX_FAILURES = 3;

  static getInstance(): BackendPreloader {
    if (!BackendPreloader.instance) {
      BackendPreloader.instance = new BackendPreloader();
    }
    return BackendPreloader.instance;
  }

  async preloadBackend(): Promise<boolean> {
    const now = Date.now();
    
    // Don't preload if we already did it recently and it was successful
    if (this.preloadPromise && this.isWarmedUp && (now - this.lastPreloadTime) < this.PRELOAD_INTERVAL) {
      return this.preloadPromise;
    }

    this.preloadPromise = this.performEnhancedPreload();
    this.lastPreloadTime = now;
    
    return this.preloadPromise;
  }

  private async performEnhancedPreload(): Promise<boolean> {
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔥 Backend warmup attempt ${attempt}/${maxAttempts}...`);
        const startTime = Date.now();
        
        // Progressive timeout increase for cold starts
        const timeout = 30000 + (attempt * 30000); // 30s, 60s, 90s
        
        const response = await apiClient.get('/api/health', { 
          timeout,
          validateStatus: () => true // Accept any status
        });
        
        const duration = Date.now() - startTime;
        
        if (response.status === 200) {
          this.isWarmedUp = true;
          this.consecutiveFailures = 0;
          console.log(`✅ Backend warmed up successfully in ${duration}ms`);
          
          // Preload critical data
          await this.preloadCriticalData();
          
          return true;
        } else {
          console.warn(`⚠️ Backend responded with status ${response.status}`);
        }
        
      } catch (error: any) {
        console.warn(`❌ Warmup attempt ${attempt} failed:`, error.message);
        
        if (error.code === 'ECONNABORTED') {
          console.log('❄️ Cold start timeout - this is normal on Render free tier');
        }
      }
      
      // Wait between attempts with exponential backoff
      if (attempt < maxAttempts) {
        const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.consecutiveFailures++;
    this.isWarmedUp = false;
    
    if (this.consecutiveFailures >= this.MAX_FAILURES) {
      console.error('🚨 Multiple consecutive failures - backend may be down');
    }
    
    return false;
  }

  private async preloadCriticalData(): Promise<void> {
    try {
      console.log('📦 Preloading critical data...');
      
      // Preload essential endpoints in parallel with shorter timeouts
      const criticalRequests = [
        apiClient.get('/api/accounts/summary', { timeout: 20000 }),
        apiClient.get('/api/secretaries', { timeout: 20000 })
      ];
      
      const results = await Promise.allSettled(criticalRequests);
      
      results.forEach((result, index) => {
        const endpoints = ['/api/accounts/summary', '/api/secretaries'];
        if (result.status === 'fulfilled') {
          console.log(`✅ Preloaded: ${endpoints[index]}`);
        } else {
          console.warn(`⚠️ Failed to preload: ${endpoints[index]}`);
        }
      });
      
    } catch (error) {
      console.warn('⚠️ Critical data preload failed:', error);
    }
  }

  // Enhanced warmup with user feedback
  async warmUpBackend(): Promise<boolean> {
    console.log('🚀 Starting enhanced backend warmup...');
    
    try {
      const result = await this.preloadBackend();
      
      if (result) {
        console.log('🎉 Backend is ready for use!');
        this.startKeepAlive();
      } else {
        console.warn('⚠️ Backend warmup incomplete - some features may be slow');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Backend warmup failed:', error);
      return false;
    }
  }

  // Keep backend alive with periodic requests
  private startKeepAlive(): void {
    // Send keep-alive request every 10 minutes
    setInterval(async () => {
      if (this.isWarmedUp) {
        try {
          await apiClient.get('/api/health', { timeout: 10000 });
          console.log('💚 Keep-alive successful');
        } catch (error) {
          console.warn('💔 Keep-alive failed - backend may be sleeping');
          this.isWarmedUp = false;
        }
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  // Get current backend status
  getStatus(): {
    isWarmedUp: boolean;
    consecutiveFailures: number;
    lastPreloadTime: number;
    timeSinceLastPreload: number;
  } {
    return {
      isWarmedUp: this.isWarmedUp,
      consecutiveFailures: this.consecutiveFailures,
      lastPreloadTime: this.lastPreloadTime,
      timeSinceLastPreload: this.lastPreloadTime ? Date.now() - this.lastPreloadTime : -1
    };
  }

  // Force immediate warmup
  async forceWarmup(): Promise<boolean> {
    console.log('🚨 Force warmup initiated...');
    this.isWarmedUp = false;
    this.preloadPromise = null;
    this.lastPreloadTime = 0;
    return await this.warmUpBackend();
  }
}

export const backendPreloader = BackendPreloader.getInstance();

/**
 * Cache Management Utility
 * 
 * Provides comprehensive cache clearing and data cleanup functionality
 * for the visa management system.
 */

interface CacheStats {
  localStorage: number;
  sessionStorage: number;
  indexedDB: string[];
  serviceWorker: boolean;
  apiCache: number;
}

class CacheManager {
  private static instance: CacheManager;
  
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Clear all browser storage (localStorage, sessionStorage)
   */
  public clearBrowserStorage(): void {
    try {
      const localStorageSize = this.getStorageSize(localStorage);
      const sessionStorageSize = this.getStorageSize(sessionStorage);
      
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('🧹 Browser storage cleared:');
      console.log(`   • localStorage: ${localStorageSize} items removed`);
      console.log(`   • sessionStorage: ${sessionStorageSize} items removed`);
    } catch (error) {
      console.error('❌ Error clearing browser storage:', error);
    }
  }

  /**
   * Clear IndexedDB databases
   */
  public async clearIndexedDB(): Promise<void> {
    try {
      if (!window.indexedDB) {
        console.log('⚠️ IndexedDB not supported');
        return;
      }

      const databases = await indexedDB.databases();
      const deletePromises = databases.map(db => {
        if (db.name) {
          return new Promise<void>((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name!);
            deleteReq.onsuccess = () => {
              console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
              resolve();
            };
            deleteReq.onerror = () => reject(deleteReq.error);
          });
        }
        return Promise.resolve();
      });

      await Promise.all(deletePromises);
      console.log('✅ All IndexedDB databases cleared');
    } catch (error) {
      console.error('❌ Error clearing IndexedDB:', error);
    }
  }

  /**
   * Clear Service Worker caches
   */
  public async clearServiceWorkerCaches(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('⚠️ Service Worker not supported');
        return;
      }

      if (!('caches' in window)) {
        console.log('⚠️ Cache API not supported');
        return;
      }

      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => {
        console.log(`🗑️ Deleting cache: ${cacheName}`);
        return caches.delete(cacheName);
      });

      await Promise.all(deletePromises);
      console.log(`✅ Cleared ${cacheNames.length} service worker caches`);
    } catch (error) {
      console.error('❌ Error clearing service worker caches:', error);
    }
  }

  /**
   * Clear axios cache (if using interceptors)
   */
  public clearAxiosCache(): void {
    try {
      // Clear any cached responses in memory
      if (window.axiosCache) {
        window.axiosCache.clear();
        console.log('🧹 Axios cache cleared');
      }
      
      // Clear any cached API responses from localStorage
      const keys = Object.keys(localStorage);
      const apiCacheKeys = keys.filter(key => 
        key.startsWith('api_cache_') || 
        key.startsWith('axios_cache_') ||
        key.startsWith('visa_cache_')
      );
      
      apiCacheKeys.forEach(key => localStorage.removeItem(key));
      
      if (apiCacheKeys.length > 0) {
        console.log(`🧹 Removed ${apiCacheKeys.length} API cache entries`);
      }
    } catch (error) {
      console.error('❌ Error clearing axios cache:', error);
    }
  }

  /**
   * Clear React Query cache (if using)
   */
  public clearReactQueryCache(): void {
    try {
      // Clear React Query cache from localStorage
      const keys = Object.keys(localStorage);
      const queryKeys = keys.filter(key => 
        key.startsWith('REACT_QUERY_') ||
        key.startsWith('react-query-')
      );
      
      queryKeys.forEach(key => localStorage.removeItem(key));
      
      if (queryKeys.length > 0) {
        console.log(`🧹 Removed ${queryKeys.length} React Query cache entries`);
      }
    } catch (error) {
      console.error('❌ Error clearing React Query cache:', error);
    }
  }

  /**
   * Clear browser cookies
   */
  public clearCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      let clearedCount = 0;
      
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (name) {
          // Clear for current domain
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          // Clear for parent domain
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          clearedCount++;
        }
      });
      
      if (clearedCount > 0) {
        console.log(`🍪 Cleared ${clearedCount} cookies`);
      }
    } catch (error) {
      console.error('❌ Error clearing cookies:', error);
    }
  }

  /**
   * Clear backend server cache
   */
  public async clearBackendCache(): Promise<void> {
    try {
      const module = await import('../config/axios');
      const apiClient = module.default;
      const response = await apiClient.post('/api/accounts/clear-cache', {});
      if (response.status === 200) {
        console.log('🧹 Backend cache cleared:', response.data?.message || 'done');
      } else {
        console.warn('⚠️ Failed to clear backend cache:', response.statusText);
      }
    } catch (error) {
      console.warn('⚠️ Could not clear backend cache:', error);
    }
  }

  /**
   * Clear all application data and caches
   */
  public async clearAllData(): Promise<void> {
    console.log('🚀 Starting comprehensive cache and data clearing...');
    
    try {
      // Clear browser storage
      this.clearBrowserStorage();
      
      // Clear API caches
      this.clearAxiosCache();
      this.clearReactQueryCache();
      
      // Clear cookies
      this.clearCookies();
      
      // Clear IndexedDB
      await this.clearIndexedDB();
      
      // Clear Service Worker caches
      await this.clearServiceWorkerCaches();
      
      // Clear backend cache
      await this.clearBackendCache();
      
      console.log('✅ All caches and data cleared successfully');
      
      // Show user notification
      this.showClearNotification();
      
    } catch (error) {
      console.error('❌ Error during cache clearing:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<CacheStats> {
    const stats: CacheStats = {
      localStorage: this.getStorageSize(localStorage),
      sessionStorage: this.getStorageSize(sessionStorage),
      indexedDB: [],
      serviceWorker: false,
      apiCache: 0
    };

    try {
      // IndexedDB stats
      if (window.indexedDB) {
        const databases = await indexedDB.databases();
        stats.indexedDB = databases.map(db => db.name || 'unknown');
      }

      // Service Worker cache stats
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        stats.serviceWorker = cacheNames.length > 0;
      }

      // API cache stats
      const keys = Object.keys(localStorage);
      stats.apiCache = keys.filter(key => 
        key.startsWith('api_cache_') || 
        key.startsWith('axios_cache_') ||
        key.startsWith('visa_cache_')
      ).length;

    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
    }

    return stats;
  }

  /**
   * Clear specific cache by type
   */
  public async clearSpecificCache(type: 'storage' | 'indexeddb' | 'serviceworker' | 'api' | 'cookies'): Promise<void> {
    switch (type) {
      case 'storage':
        this.clearBrowserStorage();
        break;
      case 'indexeddb':
        await this.clearIndexedDB();
        break;
      case 'serviceworker':
        await this.clearServiceWorkerCaches();
        break;
      case 'api':
        this.clearAxiosCache();
        this.clearReactQueryCache();
        break;
      case 'cookies':
        this.clearCookies();
        break;
      default:
        throw new Error(`Unknown cache type: ${type}`);
    }
  }

  /**
   * Force reload application after clearing caches
   */
  public forceReload(): void {
    console.log('🔄 Force reloading application...');
    
    // Clear any remaining in-memory state
    if (window.location.reload) {
      window.location.reload();
    } else {
      // Fallback for older browsers
      window.location.href = window.location.href;
    }
  }

  /**
   * Schedule automatic cache clearing
   */
  public scheduleAutoClear(intervalHours: number = 24): void {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(() => {
      console.log('⏰ Scheduled cache clearing...');
      this.clearAllData().catch(error => {
        console.error('❌ Scheduled cache clearing failed:', error);
      });
    }, intervalMs);
    
    console.log(`📅 Scheduled automatic cache clearing every ${intervalHours} hours`);
  }

  // Helper methods
  private getStorageSize(storage: Storage): number {
    try {
      return storage.length;
    } catch (error) {
      return 0;
    }
  }

  private showClearNotification(): void {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = '✅ All caches cleared successfully';
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Global cache manager instance
export const cacheManager = CacheManager.getInstance();

// Add to window for debugging
declare global {
  interface Window {
    cacheManager: CacheManager;
    axiosCache?: Map<string, any>;
  }
}

window.cacheManager = cacheManager;

export default CacheManager;

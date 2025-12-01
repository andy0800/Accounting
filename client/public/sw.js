// Service Worker for Advanced Caching
const CACHE_NAME = 'visa-system-v2'; // Updated version to force cache refresh
const STATIC_CACHE = 'visa-system-static-v2';
const API_CACHE = 'visa-system-api-v2';

// Cache clearing messages
const CACHE_CLEAR_MESSAGE = 'CLEAR_ALL_CACHES';
const FORCE_REFRESH_MESSAGE = 'FORCE_REFRESH';

// Files to cache immediately (keep minimal to avoid install failures on static hosts)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/health',
  '/api/secretaries',
  '/api/accounts/summary'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy (avoid stale data and install issues)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static files with cache-first strategy
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests with network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
});

// API request handler - network-first with cache fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  // Only cache GET requests
  const isGet = request.method === 'GET';
  const cacheKey = isGet ? request : undefined;
  const cachedResponse = isGet && cacheKey ? await cache.match(cacheKey) : undefined;

  try {
    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache only GET successful responses
    if (isGet && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      console.log('💾 Cached API response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error('🌐 Network error, serving from cache:', error);
    
    // Return cached response as fallback (GET only)
    if (isGet && cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline style JSON for API errors
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true,
        message: 'يرجى التحقق من اتصال الإنترنت'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static file handler - cache first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('📦 Serving static file from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      console.log('💾 Cached static file:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch static file:', error);
    return new Response('File not available offline', { status: 404 });
  }
}

// Navigation handler - network first with SPA fallback to index.html on 4xx/5xx
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    // If server returns an error for deep link, fallback to cached index.html (SPA)
    if (!networkResponse || !networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      const spa = (await cache.match('/index.html')) || (await cache.match('/'));
      if (spa) return spa;
      // As last resort, fetch index.html directly
      try {
        const idx = await fetch('/index.html');
        if (idx && idx.ok) return idx;
      } catch (_) {}
    }
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network unavailable, serving offline page');
    const cache = await caches.open(STATIC_CACHE);
    const spa = (await cache.match('/index.html')) || (await cache.match('/'));
    if (spa) return spa;
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>غير متصل - نظام التأشيرات</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <h1 class="offline">غير متصل بالإنترنت</h1>
          <p>يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى</p>
          <button onclick="window.location.reload()">إعادة المحاولة</button>
        </body>
      </html>
      `,
      { 
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('🔄 Performing background sync...');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'إشعار جديد من نظام التأشيرات',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      dir: 'rtl',
      lang: 'ar',
      tag: 'visa-notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'نظام التأشيرات', options)
    );
  }
});

// Message handling for cache clearing
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === CACHE_CLEAR_MESSAGE) {
    event.waitUntil(clearAllCaches().then(() => {
      // Notify the client that caches are cleared
      event.ports[0].postMessage({ success: true, message: 'All caches cleared' });
    }));
  }
  
  if (event.data && event.data.type === FORCE_REFRESH_MESSAGE) {
    event.waitUntil(
      clearAllCaches().then(() => {
        // Force refresh all clients
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach(client => {
          client.navigate(client.url);
        });
      })
    );
  }
});

// Clear all caches function
async function clearAllCaches() {
  console.log('🧹 Clearing all Service Worker caches...');
  
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(cacheName => {
      console.log('🗑️ Deleting cache:', cacheName);
      return caches.delete(cacheName);
    });
    
    await Promise.all(deletePromises);
    console.log('✅ All Service Worker caches cleared');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    throw error;
  }
}

// Clear expired cache entries
async function clearExpiredCaches() {
  console.log('🧹 Clearing expired cache entries...');
  
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = response.headers.get('sw-cache-time');
        if (cacheTime && Date.now() - parseInt(cacheTime) > 24 * 60 * 60 * 1000) { // 24 hours
          await cache.delete(request);
          console.log('🗑️ Deleted expired cache entry:', request.url);
        }
      }
    }
    
    console.log('✅ Expired cache entries cleared');
  } catch (error) {
    console.error('❌ Error clearing expired caches:', error);
  }
}

// Schedule periodic cache cleanup
setInterval(() => {
  clearExpiredCaches();
}, 60 * 60 * 1000); // Every hour

console.log('🚀 Service Worker loaded successfully with cache management');

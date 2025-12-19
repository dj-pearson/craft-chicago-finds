/**
 * Service Worker
 * Handles caching, offline support, and background sync
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `craftlocal-${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API cache name
const API_CACHE = `craftlocal-api-${CACHE_VERSION}`;

// Image cache name
const IMAGE_CACHE = `craftlocal-images-${CACHE_VERSION}`;

// Cache expiration time (7 days)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== API_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - serve from cache with network fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    // API requests - Network first, cache fallback
    // Note: Using hostname check for self-hosted Supabase at api.craftlocal.net
    if (url.pathname.includes('/api/') || url.hostname.includes('api.craftlocal.net')) {
      event.respondWith(networkFirstStrategy(request, API_CACHE));
    }
    // Images - Cache first, network fallback
    else if (request.destination === 'image') {
      event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    }
    // Static assets - Cache first, network fallback
    else if (
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font'
    ) {
      event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    }
    // Navigation - Network first, cache fallback, offline page
    else if (request.mode === 'navigate') {
      event.respondWith(navigationStrategy(request));
    }
    // Everything else - Network first
    else {
      event.respondWith(
        fetch(request).catch(() => {
          return caches.match(request);
        })
      );
    }
  }
});

/**
 * Cache first, network fallback strategy
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check if cache is stale
    const cacheTime = await getCacheTime(request);
    const isStale = Date.now() - cacheTime > CACHE_EXPIRATION;
    
    if (!isStale) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await setCacheTime(request);
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network first, cache fallback strategy
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await setCacheTime(request);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Navigation strategy with offline fallback
 */
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Show offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - CraftLocal</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 {
              color: #333;
              margin-bottom: 1rem;
            }
            p {
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

/**
 * Get cache timestamp
 */
async function getCacheTime(request) {
  const cache = await caches.open('cache-timestamps');
  const response = await cache.match(request.url);
  
  if (response) {
    const timestamp = await response.text();
    return parseInt(timestamp, 10);
  }
  
  return 0;
}

/**
 * Set cache timestamp
 */
async function setCacheTime(request) {
  const cache = await caches.open('cache-timestamps');
  const timestamp = Date.now().toString();
  
  await cache.put(
    request.url,
    new Response(timestamp, {
      headers: { 'Content-Type': 'text/plain' },
    })
  );
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

/**
 * Sync cart data
 */
async function syncCart() {
  try {
    // Get pending cart updates from IndexedDB
    // Send to server
    console.log('[ServiceWorker] Syncing cart data');
  } catch (error) {
    console.error('[ServiceWorker] Cart sync failed:', error);
  }
}

/**
 * Sync favorites data
 */
async function syncFavorites() {
  try {
    console.log('[ServiceWorker] Syncing favorites');
  } catch (error) {
    console.error('[ServiceWorker] Favorites sync failed:', error);
  }
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const data = event.data?.json() || {};
  const title = data.title || 'CraftLocal';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.url,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.openWindow(url)
  );
});

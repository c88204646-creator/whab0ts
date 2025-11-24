const CACHE_NAME = 'crm-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Si falla, continúa (es normal en desarrollo)
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // No cachear: APIs, WebSocket, etc
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('socket')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si es una respuesta válida, cachearlo
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Si falla, intentar obtener del cache
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nueva notificación',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('CRM Panel', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

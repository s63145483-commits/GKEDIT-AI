// GKEDIT AI Progressive Web App Service Worker
const CACHE_NAME = 'gkedit-ai-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Precaching notice:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('gkedit-ai-')) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass API routes and WebSocket connections to ensure live data
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and refresh in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback to offline root page
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

// Background Push Notification listener for incoming messages and WebRTC calls
self.addEventListener('push', (event) => {
  let data = {
    title: 'GK-Chat Notification',
    body: 'New secure message received',
    isCall: false,
    url: '/',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const isCall = !!data.isCall || data.type === 'call';
  const title = data.title || (isCall ? `📞 Incoming Call: ${data.callerName || 'GK Contact'}` : '💬 GK-Chat Message');

  const options = {
    body: data.body || (isCall ? 'Tap to answer or decline the incoming call' : 'Encrypted E2EE message arrived'),
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: isCall ? 'gk-call-incoming' : 'gk-message-incoming',
    renotify: true,
    requireInteraction: isCall,
    vibrate: isCall ? [300, 150, 300, 150, 500] : [200, 100, 200],
    data: data,
    actions: isCall
      ? [
          { action: 'accept', title: '📞 Accept' },
          { action: 'decline', title: '✕ Decline' },
        ]
      : [{ action: 'open', title: '💬 Open Chat' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Chrome & System Notification click event: focus window & handle action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const action = event.action;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (action === 'accept') {
            client.postMessage({ type: 'ACCEPT_INCOMING_CALL', data: notifData });
          } else if (action === 'decline') {
            client.postMessage({ type: 'DECLINE_INCOMING_CALL', data: notifData });
          } else {
            client.postMessage({ type: 'OPEN_CHAT', data: notifData });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(notifData.url || '/');
      }
    })
  );
});

// Background message handler from client or push
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
});


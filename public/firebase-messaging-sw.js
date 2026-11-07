// Firebase Cloud Messaging Service Worker for GKEDIT AI
// Handles background push notifications when the app is closed or in background.

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Standard Firebase config - replace with your project credentials if custom project is configured
const firebaseConfig = {
  apiKey: "AIzaSy_GKEDIT_PLACEHOLDER_KEY",
  authDomain: "gkedit-ai.firebaseapp.com",
  projectId: "gkedit-ai",
  storageBucket: "gkedit-ai.appspot.com",
  messagingSenderId: "941432679029",
  appId: "1:941432679029:web:abcdef"
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Background push payload received:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'GKEDIT AI';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'New response ready',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'gkedit-push-' + Date.now(),
      data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Background worker init:', err);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

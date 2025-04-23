// Service Worker for Push Notifications

// List of paths that should NOT be intercepted
const AUTH_PATHS = [
  '/auth/',
  '/auth/v1/',
  '/api/auth',
  '/login',
  '/logout',
  '/sign-up',
  '/reset-password'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
});

// Don't intercept fetch requests to avoid interference with authentication
self.addEventListener('fetch', (event) => {
  // Check if this is an auth-related request
  const url = new URL(event.request.url);
  const isAuthRequest = AUTH_PATHS.some(path => url.pathname.includes(path));
  
  // Don't interfere with auth requests
  if (isAuthRequest) {
    console.log('Auth request detected, not intercepting:', url.pathname);
    return;
  }
  
  // For all other requests, let them pass through normally
  // This is essentially a no-op fetch handler
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    
    // Show the notification
    const title = data.title || 'Whistl Notification';
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/logo192.png', // Make sure this file exists in your public folder
      badge: '/badge-icon.png', // Optional: smaller icon for notification tray
      data: {
        url: data.url || '/' // URL to open when notification is clicked
      },
      tag: data.tag || 'default', // Group similar notifications
      renotify: data.renotify || false, // Whether to notify the user again for same tag
      actions: data.actions || [] // Buttons to show on the notification
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // This looks to see if the current is open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Get the URL to open
        const urlToOpen = event.notification.data?.url || '/';

        // Look for an existing window/tab to use
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
}); 
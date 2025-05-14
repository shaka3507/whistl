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
      icon: '/favicon.svg', // Using the favicon.svg file
      badge: '/favicon.svg', // Using the same SVG for badge
      data: {
        url: data.url || '/', // URL to open when notification is clicked
        messageId: data.messageId || null, // Store the message ID for acknowledgment
        requiresAcknowledgment: data.requiresAcknowledgment || false // Whether this notification requires explicit acknowledgment
      },
      tag: data.tag || 'default', // Group similar notifications
      renotify: data.renotify || false, // Whether to notify the user again for same tag
      actions: data.actions || [], // Buttons to show on the notification
      requireInteraction: data.requiresAcknowledgment || false // Keep notification visible until user interacts if acknowledgment is required
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
  const notification = event.notification;
  const notificationData = notification.data || {};
  const urlToOpen = notificationData.url || '/';
  const messageId = notificationData.messageId;
  const requiresAcknowledgment = notificationData.requiresAcknowledgment;
  
  // Close the notification
  notification.close();

  // Track acknowledgment if message requires it
  if (requiresAcknowledgment && messageId) {
    // Create a record of the acknowledgment to be sent when online
    const acknowledgeNotification = async () => {
      try {
        // Try to send acknowledgment to server
        const response = await fetch('/api/acknowledge-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId: messageId,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to acknowledge notification');
        }
        
        console.log('Notification acknowledged successfully');
      } catch (error) {
        console.error('Error acknowledging notification:', error);
        
        // Store failed acknowledgments for retry later
        const storedAcks = JSON.parse(localStorage.getItem('pendingAcknowledgments') || '[]');
        storedAcks.push({ messageId, timestamp: new Date().toISOString() });
        localStorage.setItem('pendingAcknowledgments', JSON.stringify(storedAcks));
      }
    };
    
    // Try to acknowledge the notification
    event.waitUntil(acknowledgeNotification());
  }

  // This looks to see if the current is open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Look for an existing window/tab to use
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            client.focus();
            // Try to navigate to the specific URL if it's different from current
            if (client.url !== urlToOpen && 'navigate' in client) {
              return client.navigate(urlToOpen);
            }
            return client;
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
}); 
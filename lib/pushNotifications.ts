import { supabase } from './supabase';

// Convert base64 string to Uint8Array
// (needed for the applicationServerKey)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if service workers are supported
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Check notification permission status
export async function getNotificationPermissionStatus() {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Register service worker
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications not supported');
  }

  try {
    // Check if there are existing service worker registrations
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    
    // Only register if we don't already have a service worker for /sw.js
    const swRegistration = existingRegistrations.find(reg => 
      reg.active && reg.active.scriptURL.includes('/sw.js')
    );
    
    if (swRegistration) {
      console.log('Using existing service worker registration');
      return swRegistration;
    }
    
    // Register a new service worker with a scope that doesn't interfere with auth
    console.log('Registering new service worker');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    // Wait for the service worker to be ready
    if (registration.installing) {
      console.log('Service worker installing');
      
      return new Promise<ServiceWorkerRegistration>((resolve) => {
        const installer = registration.installing;
        if (!installer) {
          // If somehow installer is null, return the registration anyway
          return resolve(registration);
        }
        
        installer.addEventListener('statechange', (e) => {
          // Check the state of the service worker
          const serviceWorker = e.target as ServiceWorker;
          if (serviceWorker.state === 'activated') {
            console.log('Service worker activated');
            resolve(registration);
          }
        });
      });
    }
    
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    throw error;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId: string) {
  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    console.log('Registering service worker...');
    const registration = await registerServiceWorker();
    
    // Use your VAPID public key from step 1
    const vapidPublicKey = 'BMR_S873mOj37k8T-je1GF-WDgvvnUfH7rfGslAJrZwEi1rF9NzP3HRuGQG07oLc7MRmZH8jF2p-kzpTPQeyF7Y';
    
    const subscriptionOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    };

    console.log('Subscribing to push notifications...');
    const subscription = await registration.pushManager.subscribe(subscriptionOptions);
    const subscriptionJson = subscription.toJSON();

    console.log('Saving subscription to Supabase...');
    // Save the subscription to Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: JSON.stringify(subscriptionJson),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId: string) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove subscription from Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    throw error;
  }
} 
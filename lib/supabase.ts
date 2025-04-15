import { createClient } from "@supabase/supabase-js"
import { Database } from "./supabase-types"

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Extend globalThis for our custom properties
declare global {
  var lastAuthRequest: number;
  var invalidTokenDetected: boolean;
}

if (typeof globalThis.lastAuthRequest === 'undefined') {
  globalThis.lastAuthRequest = 0;
}

if (typeof globalThis.invalidTokenDetected === 'undefined') {
  globalThis.invalidTokenDetected = false;
}

console.log(`Initializing Supabase client with URL: ${supabaseUrl}`)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'whistl-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'whistl',
    },
    // Add request throttling
    fetch: (url, options) => {
      // Add cache control for auth token endpoint to minimize polling
      if (url.toString().includes('auth/token')) {
        // If we've already detected an invalid token, stop trying to refresh it
        // and immediately return an error response
        if (globalThis.invalidTokenDetected) {
          console.log('Invalid token previously detected, blocking refresh attempt');
          return Promise.resolve(new Response(JSON.stringify({ 
            error: {
              message: "Refresh token invalid or expired",
              status: 400
            },
            data: { session: null } 
          }), { 
            status: 400,
            headers: new Headers({'content-type': 'application/json'})
          }));
        }
        
        // Apply strict rate limiting to token refreshes
        const now = Date.now();
        const minInterval = 120000; // 2 minutes minimum between requests (increased from 1 minute)
        
        if (now - globalThis.lastAuthRequest < minInterval) {
          console.log('Throttling auth request, too frequent. Next allowed in', 
            Math.round((minInterval - (now - globalThis.lastAuthRequest))/1000), 'seconds');
          
          // Return a resolved promise with a mock response
          return Promise.resolve(new Response(JSON.stringify({ 
            error: null, 
            data: { session: null }
          }), { 
            status: 200,
            headers: new Headers({'content-type': 'application/json'})
          }));
        }
        
        // Update last request timestamp
        globalThis.lastAuthRequest = now;
        console.log('Allowing auth token refresh attempt', new Date().toISOString());
        
        // Execute the real request, but catch refresh_token_not_found errors
        return fetch(url, options).then(async (response) => {
          // Check for refresh token errors
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();
            
            if (data.error) {
              console.error('Auth token error:', data.error.message);
              
              if (data.error.message === "refresh_token_not_found" || 
                  data.error.message?.includes("refresh token") ||
                  data.error.message?.includes("invalid") ||
                  data.error.status === 401) {
                
                console.error('Invalid refresh token detected, clearing auth state');
                globalThis.invalidTokenDetected = true;
                
                // Clear all auth related local storage
                try {
                  localStorage.removeItem('supabase.auth.token');
                  localStorage.removeItem('whistl-auth-token');
                  localStorage.removeItem('whistl-session');
                  localStorage.removeItem('sb-refresh-token');
                  
                  // Clear any item that looks like an auth token
                  Object.keys(localStorage).forEach(key => {
                    if (key.includes('auth') || key.includes('token') || key.includes('session')) {
                      localStorage.removeItem(key);
                    }
                  });
                } catch (e) {
                  console.error('Error clearing localStorage:', e);
                }
                
                // After 2 minutes, allow token refresh attempts again
                setTimeout(() => {
                  globalThis.invalidTokenDetected = false;
                }, 120000); // Increased from 30 seconds to 2 minutes
                
                // Force page reload to reset auth state after a delay
                setTimeout(() => {
                  if (typeof window !== 'undefined') {
                    console.log('Reloading page to reset auth state');
                    window.location.href = '/login';
                  }
                }, 500);
              }
            }
          } catch (e) {
            // If we can't parse the response, just continue
            console.error('Error parsing response:', e);
          }
          
          return response;
        }).catch(error => {
          console.error('Network error during token refresh:', error);
          // Return a non-retryable error response
          return new Response(JSON.stringify({ 
            error: {
              message: "Network error during token refresh",
              status: 503
            },
            data: { session: null } 
          }), { 
            status: 503,
            headers: new Headers({'content-type': 'application/json'})
          });
        });
      }
      
      return fetch(url, options);
    },
  },
  // Configure retries and timeouts
  realtime: {
    params: {
      eventsPerSecond: 1, // Reduce realtime events rate further
    },
  },
})

// Optionally force clear any stale data on initialization
if (typeof window !== 'undefined') {
  // Check localStorage for suspicious auth data
  try {
    const sessionData = localStorage.getItem('whistl-session');
    if (sessionData) {
      try {
        const { data } = JSON.parse(sessionData);
        if (data?.expires_at) {
          const expirationTime = data.expires_at * 1000;
          const now = Date.now();
          
          // If expiration is more than 4 hours away or in the past
          if (expirationTime > (now + 4 * 60 * 60 * 1000) || expirationTime < now) {
            console.warn('Found suspicious session expiration in localStorage on init');
            
            // Clear all auth related storage
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('whistl-auth-token');
            localStorage.removeItem('whistl-session');
            localStorage.removeItem('sb-refresh-token');
            
            Object.keys(localStorage).forEach(key => {
              if (key.includes('auth') || key.includes('token') || key.includes('session')) {
                localStorage.removeItem(key);
              }
            });
          }
        }
      } catch (e) {
        console.error('Error parsing cached session on init, clearing:', e);
        localStorage.removeItem('whistl-session');
      }
    }
  } catch (e) {
    console.error('Error checking localStorage on init:', e);
  }
}


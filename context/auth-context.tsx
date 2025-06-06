"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase-types";

// Import the global type declarations to make TypeScript aware of them
// This makes the linter know that globalThis.invalidTokenDetected is properly declared
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, isAdmin: boolean) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache settings
const SESSION_CACHE_KEY = 'whistl-session';
const PROFILE_CACHE_KEY = 'whistl-profile';
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const lastAuthCheck = useRef<number>(0);
  const authCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  // Add state to track if we're currently redirecting after sign-in
  const isRedirecting = useRef<boolean>(false);
  // Add a flag to completely disable auth event handling when needed
  const disableAuthEvents = useRef<boolean>(false);
  // Add a flag to prevent repeated logs in short time period
  const sessionLoggedRecently = useRef<boolean>(false);

  // On first load, check for and clean up any corrupted auth data
  useEffect(() => {
    try {
      // Check for potentially corrupted auth session data with suspicious dates
      const sessionData = localStorage.getItem(SESSION_CACHE_KEY);
      if (sessionData) {
        try {
          const { data } = JSON.parse(sessionData);
          if (data?.expires_at) {
            const expirationTime = data.expires_at * 1000;
            const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000);
            
            // If expiration is more than a year away, it's likely corrupted
            if (expirationTime > oneYearFromNow) {
              console.warn('Found suspicious auth data with far-future expiration, clearing all auth data');
              clearCache();
              
              // Also clear any Supabase-specific auth data
              Object.keys(localStorage).forEach(key => {
                if (key.includes('auth') || key.includes('token') || key.includes('supabase')) {
                  localStorage.removeItem(key);
                }
              });
            }
          }
        } catch (e) {
          console.error('Error parsing cached session, clearing auth data', e);
          clearCache();
        }
      }
    } catch (e) {
      console.error('Error checking for corrupted auth data', e);
    }
  }, []);

  // Helper function for exponential backoff
  const fetchWithRetry = useCallback(async (
    fn: () => Promise<any>,
    maxRetries: number = MAX_RETRIES,
    initialBackoff: number = INITIAL_BACKOFF
  ) => {
    let retries = 0;
    let backoff = initialBackoff;
    
    while (retries <= maxRetries) {
      try {
        return await fn();
      } catch (error: any) {
        retries++;
        
        // If it's a rate limit error or we've exhausted retries, throw the error
        if (error?.status === 429 || retries > maxRetries) {
          console.error(`Rate limited or max retries reached (${retries}/${maxRetries})`, error);
          throw error;
        }
        
        // Wait with exponential backoff before retrying
        console.log(`Retrying (${retries}/${maxRetries}) after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
      }
    }
  }, []);

  const getCachedData = useCallback((key: string) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache has expired based on our interval
      if (Date.now() - timestamp > AUTH_CHECK_INTERVAL) {
        localStorage.removeItem(key);
        return null;
      }

      // For session data, validate the session expiration is reasonable
      if (key === SESSION_CACHE_KEY && data?.expires_at) {
        const expirationTime = data.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        
        // Session is already expired
        if (expirationTime < now) {
          console.log('Cached session is expired, removing');
          localStorage.removeItem(key);
          return null;
        }
        
        // Session expires too far in the future (more than 24 hours)
        // This catches incorrectly formatted dates or unusual values
        const oneDayFromNow = now + (24 * 60 * 60 * 1000);
        if (expirationTime > oneDayFromNow) {
          console.log('Cached session has suspicious expiration date, removing', new Date(expirationTime));
          localStorage.removeItem(key);
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error('Error reading cached data:', error);
      return null;
    }
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    try {
      if (!data) return;
      
      // For session data, validate before caching
      if (key === SESSION_CACHE_KEY && data.expires_at) {
        const expirationTime = data.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        
        // Don't cache already expired sessions
        if (expirationTime < now) {
          console.log('Not caching expired session');
          return;
        }
        
        // Don't cache sessions with suspicious expiration dates (more than 24 hours)
        const oneDayFromNow = now + (24 * 60 * 60 * 1000);
        if (expirationTime > oneDayFromNow) {
          console.log('Not caching session with suspicious expiration date:', new Date(expirationTime));
          return;
        }
        
        console.log('Caching session with expiration:', new Date(expirationTime));
      }
      
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_CACHE_KEY);
      // Clear profile cache (could be multiple profiles)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(PROFILE_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Check cache first
      const cachedProfile = getCachedData(`${PROFILE_CACHE_KEY}:${userId}`);
      if (cachedProfile) {
        setProfile(cachedProfile);
        setIsAdmin(!!cachedProfile.is_admin);
        return cachedProfile;
      }

      // Fetch profile with retry
      const fetchProfileFn = async () => {
        console.log("Fetching fresh profile data for user:", userId);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          throw error;
        }
        
        console.log("Profile data retrieved:", data);
        return data;
      };

      let attempts = 0;
      const maxAttempts = 3;
      let profile = null;
      
      // If profile fetch fails initially (e.g., right after signup),
      // retry a few times with increasing delays
      while (attempts < maxAttempts && !profile) {
        try {
          profile = await fetchProfileFn();
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) throw error;
          
          // Wait before retrying (escalating wait time)
          const waitTime = attempts * 1000;
          console.log(`Profile fetch attempt ${attempts} failed, retrying in ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Cache the profile and update state
      if (profile) {
        setCachedData(`${PROFILE_CACHE_KEY}:${userId}`, profile);
        setProfile(profile);
        setIsAdmin(!!profile.is_admin);
        console.log("Admin status set to:", !!profile.is_admin);
        return profile;
      }
      
      return null;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }, [getCachedData, setCachedData]);

  const initializeAuth = useCallback(async () => {
    const now = Date.now();
    
    try {
      // Force clear any suspicious session data on each initialization
      const sessionData = localStorage.getItem(SESSION_CACHE_KEY);
      if (sessionData) {
        try {
          const { data } = JSON.parse(sessionData);
          if (data?.expires_at) {
            const expirationTime = data.expires_at * 1000;
            // More aggressive validation - if expiration is more than 4 hours away or in the past
            if (expirationTime > (now + 4 * 60 * 60 * 1000) || expirationTime < now) {
              console.warn('Found suspicious session expiration, clearing cache');
              clearCache();
              localStorage.removeItem(SESSION_CACHE_KEY);
            }
          }
        } catch (e) {
          console.error('Error parsing session data:', e);
          clearCache();
          localStorage.removeItem(SESSION_CACHE_KEY);
        }
      }

      // Only check auth if enough time has passed since last check
      if (now - lastAuthCheck.current < AUTH_CHECK_INTERVAL) {
        const cachedSession = getCachedData(SESSION_CACHE_KEY);
        if (cachedSession && cachedSession.expires_at) {
          const expiresAt = new Date(cachedSession.expires_at * 1000);
          const timeUntilExpiry = expiresAt.getTime() - now;
          
          // Only use cached session if it expires in a reasonable timeframe (less than 4 hours)
          if (timeUntilExpiry > 0 && timeUntilExpiry < 4 * 60 * 60 * 1000) {
            // Only log this during development to prevent console spam
            if (process.env.NODE_ENV === 'development' && !sessionLoggedRecently.current) {
              console.log('Using validated cached session, expires in:', Math.round(timeUntilExpiry/60000), 'minutes');
              // Set a flag to prevent repeated logs in short time period
              sessionLoggedRecently.current = true;
              setTimeout(() => {
                sessionLoggedRecently.current = false;
              }, 5000); // Only allow logging once every 5 seconds
            }
            
            setSession(cachedSession);
            setUser(cachedSession.user);
            
            // If we have a cached user, also check for a cached profile
            if (cachedSession.user) {
              const cachedProfile = getCachedData(`${PROFILE_CACHE_KEY}:${cachedSession.user.id}`);
              if (cachedProfile) {
                setProfile(cachedProfile);
                setIsAdmin(!!cachedProfile.is_admin);
              }
            }
            
            setIsLoading(false);
            return;
          } else {
            console.log('Cached session outside validity window, fetching new session');
            clearCache();
            localStorage.removeItem(SESSION_CACHE_KEY);
          }
        }
      }
    } catch (e) {
      console.error('Error during session validation:', e);
      clearCache();
    }

    setIsLoading(true);
    lastAuthCheck.current = now;

    try {
      // Clear any existing timeout
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }

      const getSessionFn = async () => {
        const { data, error } = await supabase.auth.getSession();
        
        // Specifically handle refresh_token_not_found errors
        if (error) {
          if (error.message === "refresh_token_not_found" ||
              error.message?.includes("refresh token")) {
            console.error("Invalid refresh token detected, clearing auth state");
            clearCache();
            return { session: null };
          }
          throw error;
        }
        
        return data;
      };

      // Fetch with retry
      const { session: currentSession } = await fetchWithRetry(getSessionFn);
      
      // Validate the fresh session before using it
      if (currentSession?.expires_at) {
        const expiresAt = new Date(currentSession.expires_at * 1000);
        const timeUntilExpiry = expiresAt.getTime() - now;
        
        if (timeUntilExpiry <= 0 || timeUntilExpiry > 4 * 60 * 60 * 1000) {
          console.warn('Fresh session has suspicious expiration, not using it');
          setUser(null);
          setProfile(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
      }
      
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      if (currentSession) {
        // Only cache valid sessions
        if (currentSession.expires_at && 
            new Date(currentSession.expires_at * 1000).getTime() > now &&
            new Date(currentSession.expires_at * 1000).getTime() < (now + 4 * 60 * 60 * 1000)) {
          setCachedData(SESSION_CACHE_KEY, currentSession);
        } else {
          console.log('Not caching session with suspicious expiration');
        }
        
        if (currentSession.user) {
          await fetchProfile(currentSession.user.id);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAdmin(false);
      clearCache();
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, getCachedData, setCachedData, clearCache, fetchWithRetry]);

  useEffect(() => {
    // Initial auth check
    initializeAuth();

    // Track the number of auth state changes to identify potential loops
    let authStateChangeCount = 0;
    let lastAuthStateChangeTime = 0;
    
    // Set up auth state change listener with debounce and throttling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Skip ALL events if auth events are disabled (during sign-in/out)
      if (disableAuthEvents.current) {
        console.log(`Auth events disabled, skipping ${event}`);
        return;
      }
      
      // Skip events during redirection
      if (isRedirecting.current) {
        console.log(`Skipping auth event ${event} during redirect`);
        return;
      }
      
      // Log for debugging purposes
      const now = Date.now();
      const timeSinceLastChange = now - lastAuthStateChangeTime;
      authStateChangeCount++;
      
      console.log(`Auth event: ${event} at ${new Date(now).toISOString()}`);
      
      // Log if auth state changes are happening too frequently
      if (timeSinceLastChange < 5000) { // Less than 5 seconds
        console.warn(`Frequent auth state changes detected: ${authStateChangeCount} changes, ${timeSinceLastChange}ms since last change`);
        
        // If we're getting too many events in succession, we might be in a loop
        if (authStateChangeCount > 5 && timeSinceLastChange < 1000) {
          console.error(`Possible auth state change loop detected. Ignoring this event: ${event}`);
          return; // Ignore this event to break potential loops
        }
      } else {
        // Reset counter if changes aren't rapid
        authStateChangeCount = 1;
      }
      
      lastAuthStateChangeTime = now;
      
      // Special handling for SIGNED_OUT events which may be triggered by token errors
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing auth state');
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAdmin(false);
        clearCache();
        return;
      }
      
      // Skip TOKEN_REFRESHED events if invalidTokenDetected is true (checked in global scope)
      if (event === 'TOKEN_REFRESHED' && globalThis.invalidTokenDetected === true) {
        console.log('Ignoring token refresh event due to invalid token');
        return;
      }
      
      // Clear any existing timeout
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }

      // For important events, update immediately; otherwise throttle heavily
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
        console.log(`Auth event: ${event}`, newSession ? (newSession.expires_at ? new Date(newSession.expires_at * 1000) : 'No expiration') : null);
        
        // Compare with existing session to avoid unnecessary updates
        const sessionChanged = JSON.stringify(session?.user) !== JSON.stringify(newSession?.user);
        
        if (sessionChanged) {
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession) {
            setCachedData(SESSION_CACHE_KEY, newSession);
            if (newSession.user) {
              await fetchProfile(newSession.user.id);
            }
          } else {
            setProfile(null);
            setIsAdmin(false);
            clearCache();
          }
        } else {
          console.log(`Auth event: ${event} - No significant session change detected, skipping update`);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // For token refreshes, just update the cached session but don't trigger re-renders
        if (newSession) {
          setCachedData(SESSION_CACHE_KEY, newSession);
          console.log(`Token refreshed, updated cache only. New expiry: ${newSession.expires_at ? new Date(newSession.expires_at * 1000) : 'unknown'}`);
        }
      } else {
        // For other events, heavily throttle to prevent excessive updates
        authCheckTimeout.current = setTimeout(async () => {
          // Double-check if the session is actually different to avoid unnecessary updates
          const cachedSessionData = getCachedData(SESSION_CACHE_KEY);
          const sessionChanged = JSON.stringify(cachedSessionData?.user) !== JSON.stringify(newSession?.user);
          
          if (sessionChanged) {
            setSession(newSession);
            setUser(newSession?.user || null);
            
            if (newSession) {
              setCachedData(SESSION_CACHE_KEY, newSession);
              if (newSession.user) {
                await fetchProfile(newSession.user.id);
              }
            } else {
              setProfile(null);
              setIsAdmin(false);
              clearCache();
            }
          }
        }, 10000); // Very long debounce (10 seconds) for non-critical events
      }
    });

    // Clean up subscription when component unmounts
    return () => {
      subscription?.unsubscribe();
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
    };
  }, [initializeAuth, fetchProfile, getCachedData, setCachedData, clearCache]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Prevent multiple sign-in attempts while one is in progress
      if (isRedirecting.current) {
        console.log('Sign-in already in progress, ignoring duplicate request');
        return { error: null };
      }

      console.log('Starting sign-in process');
      // Set both flags to prevent any auth processing during sign-in
      isRedirecting.current = true;
      disableAuthEvents.current = true;
      
      // First clear any existing tokens
      try {
        // Force clear localStorage items that might be causing issues
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('whistl-auth-token');
        localStorage.removeItem('whistl-session');
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('session')) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.error('Error clearing localStorage:', err);
      }

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error);
        isRedirecting.current = false;
        disableAuthEvents.current = false;
        return { error };
      }

      if (!data?.session) {
        console.warn('Sign in successful but no session returned');
        isRedirecting.current = false;
        disableAuthEvents.current = false;
        return { error: new Error("No session returned after sign in") };
      }

      // Save session to cache 
      console.log('Sign in successful, storing session');
      setCachedData(SESSION_CACHE_KEY, data.session);
      
      // Redirect with full page navigation
      console.log('Preparing to redirect...');
      
      // Use a hard redirect after a delay to let everything settle
      setTimeout(() => {
        // Get redirect URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectedFrom = urlParams.get("redirectedFrom") || "/";
        console.log(`Redirecting to: ${redirectedFrom}`);
        
        // This is a "hard" navigation that doesn't use Next.js router
        window.location.href = redirectedFrom;
        
        // We don't reset the flags because the page will reload anyway
      }, 500);

      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      isRedirecting.current = false;
      disableAuthEvents.current = false;
      return { error: err as Error };
    }
  }, [setCachedData]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, isAdmin: boolean = false) => {
    console.log(`Attempting to sign up user: ${email}, isAdmin: ${isAdmin}`);
    
    // Prevent multiple sign-up attempts
    if (isRedirecting.current) {
      console.log('Sign-up already in progress, ignoring duplicate request');
      return { error: null };
    }
    
    try {
      isRedirecting.current = true;
      
      // Clear any existing tokens to prevent conflicts
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('whistl-auth-token');
        localStorage.removeItem('whistl-session');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      
      console.log('Creating user account...');
      
      // Create the user with metadata that the database trigger can use
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Add metadata that the database trigger can use
            full_name: fullName,
            is_admin: isAdmin
          }
        }
      });
      
      if (signUpError) {
        console.error('Error during signup:', signUpError);
        isRedirecting.current = false;
        return { error: signUpError };
      }
      
      if (!data.user) {
        console.error('No user data returned from signup');
        isRedirecting.current = false;
        return { error: new Error("No user data returned") };
      }
      
      console.log('User created successfully with ID:', data.user.id);
      
      // DO NOT try to create a profile here - let the database trigger handle it
      
      // Only if admin access is requested, set a timeout to update it after 
      // the profile has definitely been created by the trigger
      if (isAdmin && data.user) {
        // This won't block the signup completion
        setTimeout(async () => {
          try {
            console.log('Attempting to update admin status after delay');
            
            // Double check if profile exists before attempting update
            const { data: profile, error: getError } = await supabase
              .from('profiles')
              .select('id, is_admin')
              .eq('id', data.user!.id)
              .single();
            
            if (getError || !profile) {
              console.error('Profile not found after waiting:', getError);
              return;
            }
            
            console.log('Profile found, updating admin status');
            
            // Only update if admin flag isn't already set
            if (!profile.is_admin) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', data.user!.id);
                
              if (updateError) {
                console.error('Failed to update admin status:', updateError);
              } else {
                console.log('Admin status updated successfully');
              }
            } else {
              console.log('Admin status was already set correctly');
            }
          } catch (err) {
            console.error('Error in delayed admin update:', err);
          }
        }, 5000); // Wait 5 seconds to be absolutely sure the profile exists
      }
      
      // Store session if available
      if (data.session) {
        console.log('Storing session data');
        setCachedData(SESSION_CACHE_KEY, data.session);
      } else {
        console.log('No session data available to store');
      }
      
      console.log('Signup process completed successfully');
      
      // Reset redirection flag after signup
      setTimeout(() => {
        isRedirecting.current = false;
      }, 1000);
      
      return { error: null };
    } catch (err) {
      console.error('Unexpected error in signup flow:', err);
      isRedirecting.current = false;
      return { error: err as Error };
    }
  }, [setCachedData]);

  const signOut = useCallback(async () => {
    // Prevent loops during sign-out
    if (isRedirecting.current) {
      console.log('Already signing out, ignoring duplicate request');
      return;
    }
    
    try {
      isRedirecting.current = true;
      disableAuthEvents.current = true;
      console.log('Starting sign-out process');
      
      // Clear cache first
      clearCache();
      
      // Call Supabase sign-out
      await supabase.auth.signOut();
      
      // Force clear local storage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('whistl-profile') || key.includes('token') || key.includes('session')) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.error('Error clearing localStorage:', err);
      }
      
      // Clear internal state
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAdmin(false);
      
      // Redirect with hard navigation
      setTimeout(() => {
        window.location.href = "/login";
        // We don't reset the flags because the page will reload anyway
      }, 300);
    } catch (err) {
      console.error("Error signing out:", err);
      isRedirecting.current = false;
      disableAuthEvents.current = false;
    }
  }, [clearCache]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      console.log("Starting profile update for user:", user.id);
      console.log("Update payload:", updates);
      
      // Validate the update fields 
      const sanitizedUpdates: Partial<Profile> = { ...updates };
      
      // Ensure string fields are properly trimmed
      if (typeof sanitizedUpdates.full_name === 'string') {
        sanitizedUpdates.full_name = sanitizedUpdates.full_name.trim();
      }
      
      if (typeof sanitizedUpdates.username === 'string') {
        sanitizedUpdates.username = sanitizedUpdates.username.trim();
      }
      
      // Handle any additional fields with type safety
      const anyUpdates = sanitizedUpdates as any;
      if (typeof anyUpdates.notes === 'string') {
        anyUpdates.notes = anyUpdates.notes.trim();
      }
      
      console.log("Sanitized update payload:", sanitizedUpdates);
      
      // Create update with retry
      const updateProfileFn = async () => {
        try {
          const response = await supabase
            .from("profiles")
            .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
            .eq("id", user.id)
            .select();
          
          if (response.error) {
            console.error("Supabase update error:", {
              status: response.error.code,
              message: response.error.message,
              details: response.error.details,
              hint: response.error.hint
            });
          } else {
            console.log("Profile update database response:", response);
          }
          
          return response;
        } catch (err) {
          console.error("Exception in Supabase update call:", err);
          throw err;
        }
      };

      try {
        const { error } = await fetchWithRetry(updateProfileFn);

        if (error) {
          console.error("Update profile error:", error);
          return { error };
        }

        // Refresh profile data
        await fetchProfile(user.id);
        console.log("Profile updated successfully, fetched fresh profile data");

        return { error: null };
      } catch (err) {
        console.error("Error in retry mechanism:", err);
        throw err;
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      return { error: err as Error };
    }
  }, [user, fetchProfile, fetchWithRetry]);

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
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

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache settings
const SESSION_CACHE_KEY = 'whistl-session';
const PROFILE_CACHE_KEY = 'whistl-profile';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MIN_AUTH_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes
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
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    try {
      if (!data) return;
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
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;
        return data;
      };

      const data = await fetchWithRetry(fetchProfileFn);
      
      // Cache the profile and update state
      setCachedData(`${PROFILE_CACHE_KEY}:${userId}`, data);
      setProfile(data);
      setIsAdmin(!!data.is_admin);
      return data;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  }, [getCachedData, setCachedData, fetchWithRetry]);

  const initializeAuth = useCallback(async () => {
    const now = Date.now();
    
    // Only check auth if enough time has passed since last check
    if (now - lastAuthCheck.current < MIN_AUTH_CHECK_INTERVAL) {
      const cachedSession = getCachedData(SESSION_CACHE_KEY);
      if (cachedSession) {
        console.log('Using cached session', new Date(cachedSession.expires_at * 1000));
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
      }
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
        if (error) throw error;
        return data;
      };

      const { session: currentSession } = await fetchWithRetry(getSessionFn);
      
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      if (currentSession) {
        setCachedData(SESSION_CACHE_KEY, currentSession);
        if (currentSession.user) {
          await fetchProfile(currentSession.user.id);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      setUser(null);
      setProfile(null);
      setSession(null);
      clearCache();
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, getCachedData, setCachedData, clearCache, fetchWithRetry]);

  useEffect(() => {
    // Initial auth check
    initializeAuth();

    // Set up auth state change listener with debounce
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Clear any existing timeout
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }

      // For important events, update immediately; otherwise debounce
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        console.log(`Auth event: ${event}`, newSession ? (newSession.expires_at ? new Date(newSession.expires_at * 1000) : 'No expiration') : null);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession) {
          setCachedData(SESSION_CACHE_KEY, newSession);
          if (newSession.user) {
            await fetchProfile(newSession.user.id);
          }
        } else {
          setProfile(null);
          clearCache();
        }
      } else {
        // For other events, debounce to prevent excessive updates
        authCheckTimeout.current = setTimeout(async () => {
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession) {
            setCachedData(SESSION_CACHE_KEY, newSession);
            if (newSession.user) {
              await fetchProfile(newSession.user.id);
            }
          } else {
            setProfile(null);
            clearCache();
          }
        }, 2000); // Increased debounce time
      }
    });

    return () => {
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, [initializeAuth, fetchProfile, setCachedData, clearCache]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const signInFn = async () => {
        return await supabase.auth.signInWithPassword({
          email,
          password,
        });
      };

      const { data, error } = await fetchWithRetry(signInFn);

      if (error) {
        return { error };
      }

      if (data.session) {
        setCachedData(SESSION_CACHE_KEY, data.session);
        setSession(data.session);
        setUser(data.user);
        
        if (data.user) {
          await fetchProfile(data.user.id);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirectedFrom = urlParams.get("redirectedFrom");
        router.push(redirectedFrom || "/");
      }

      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return { error: err as Error };
    }
  }, [router, setCachedData, fetchProfile, fetchWithRetry]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    let retries = 0;
    const maxRetries = 3;
    const initialBackoff = 1000;
    let backoff = initialBackoff;
    
    while (retries <= maxRetries) {
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          // If rate limited, retry with backoff
          if (signUpError.status === 429) {
            retries++;
            console.log(`Rate limited during signup, retrying (${retries}/${maxRetries}) after ${backoff}ms`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            backoff *= 2; // Exponential backoff
            continue;
          }
          return { error: signUpError };
        }

        if (!data.user) {
          return { error: new Error("No user data returned") };
        }

        // Create profile with retry
        const createProfileFn = async () => {
          return await supabase
            .from("profiles")
            .insert([
              {
                id: data.user!.id,
                full_name: fullName,
                updated_at: new Date().toISOString(),
              },
            ]);
        };

        const { error: profileError } = await fetchWithRetry(createProfileFn);

        if (profileError) {
          return { error: profileError };
        }

        // If we got here, signup was successful
        if (data.session) {
          setCachedData(SESSION_CACHE_KEY, data.session);
        }
        
        return { error: null };
      } catch (err) {
        retries++;
        
        // If max retries reached, return the error
        if (retries > maxRetries) {
          console.error("Max retries reached during signup", err);
          return { error: err as Error };
        }
        
        // Wait with exponential backoff before retrying
        console.log(`Error during signup, retrying (${retries}/${maxRetries}) after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
      }
    }
    
    // This should not be reached due to the returns inside the loop
    return { error: new Error("Unexpected error during signup") };
  }, [setCachedData, fetchWithRetry]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAdmin(false);
      clearCache();
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }, [router, clearCache]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      // Create update with retry
      const updateProfileFn = async () => {
        return await supabase
          .from("profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      };

      const { error } = await fetchWithRetry(updateProfileFn);

      if (error) {
        return { error };
      }

      // Refresh profile data
      await fetchProfile(user.id);

      return { error: null };
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
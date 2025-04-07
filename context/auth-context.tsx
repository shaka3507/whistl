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
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Exponential backoff settings
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const redirectAttempted = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) console.error("Profile fetch error:", error);
      else setProfile(data);
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    
    // Check if we have cached user data
    const storedSession = localStorage.getItem("sb-session");
    const storedUser = localStorage.getItem("sb-user");
    const lastAuthCheck = localStorage.getItem("sb-auth-last-check");
    const now = Date.now();
    
    // If we have cached data and it's less than 10 minutes old, use it
    if (storedUser && lastAuthCheck && (now - Number(lastAuthCheck)) < 10 * 60 * 1000) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser?.id) await fetchProfile(parsedUser.id);
        if (storedSession) setSession(JSON.parse(storedSession));
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing cached user data:", e);
        // Continue to fetch fresh data if parsing fails
      }
    }
    
    // Implement exponential backoff for API calls
    try {
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, retryCount);
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("User fetch error:", error);
        if (error.message.includes("rate limit") && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          return; // Will retry on next useEffect cycle
        }
      } else {
        // Reset retry count on success
        setRetryCount(0);
        setUser(user);
        
        // Cache the user data
        localStorage.setItem("sb-user", JSON.stringify(user));
        localStorage.setItem("sb-auth-last-check", String(now));
        
        if (user) await fetchProfile(user.id);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, retryCount]);

  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      setUser(session ? session.user : null);
      
      if (session?.user) {
        console.log("User authenticated, fetching profile...");
        await fetchProfile(session.user.id);
        localStorage.setItem("sb-user", JSON.stringify(session.user));
        
        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      } else {
        console.log("No session, clearing user data");
        setProfile(null);
        setIsAdmin(false);
        localStorage.removeItem("sb-user");
      }
      
      localStorage.setItem(
        "sb-session",
        session ? JSON.stringify(session) : ""
      );
      localStorage.setItem("sb-auth-last-check", String(Date.now()));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, fetchProfile]);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
        } else {
          setProfile(profile);
        }
      } else {
        setProfile(null);
      }
    }

    loadProfile();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }

      if (!data.session) {
        console.error("No session after sign in");
        return { error: new Error("Authentication failed") };
      }

      console.log("Sign in successful, checking admin status...");
      
      // Get the redirectedFrom parameter from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectedFrom = urlParams.get("redirectedFrom");
      
      // Check admin status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.session.user.id)
        .single();
      
      setIsAdmin(profile?.is_admin || false);
      
      // Update local state
      setSession(data.session);
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
      
      console.log("Redirecting to:", redirectedFrom || "/");
      router.push(redirectedFrom || "/");
      
      return { error: null };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              updated_at: new Date().toISOString(),
            },
          ]);

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("sb-session");
    localStorage.removeItem("sb-user");
    localStorage.removeItem("sb-auth-last-check");
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(updatedProfile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
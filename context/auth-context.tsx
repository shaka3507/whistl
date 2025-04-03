"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  isAdmin: boolean;
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
  const router = useRouter();

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        localStorage.setItem("sb-user", JSON.stringify(session.user));
      } else {
        setProfile(null);
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

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        const displayName = email.split("@")[0];
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: data.user.id, full_name: displayName, is_admin: false });
// 
        if (profileError) console.error("Profile creation error:", profileError);
        else await fetchProfile(data.user.id);
        
        // Cache the user data immediately
        localStorage.setItem("sb-user", JSON.stringify(data.user));
        localStorage.setItem("sb-auth-last-check", String(Date.now()));
      }

      router.refresh();
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return { error: new Error("An unexpected error occurred during sign in") };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };
    if (!data.user) return { error: new Error("User signup failed") };

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, full_name: fullName, is_admin: false });

    if (profileError) console.error("Profile creation error:", profileError);
    else router.refresh();

    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem("sb-session");
    localStorage.removeItem("sb-user");
    localStorage.removeItem("sb-auth-last-check");
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const isAdmin = profile?.is_admin ?? false;

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin,
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
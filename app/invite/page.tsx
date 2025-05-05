"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Check } from "lucide-react";

// Create a wrapper component that uses useSearchParams
function InviteContent() {
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [invitationData, setInvitationData] = useState<{
    id: string;
    email: string;
    channel_id: string;
    channel_name?: string;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  
  // Validate and load the invitation
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link. No token provided.");
        setIsLoading(false);
        return;
      }
      
      try {
        // First, check if the invitation exists and is valid
        const { data: invitation, error: invitationError } = await supabase
          .from("invitations")
          .select("id, email, channel_id, expires_at, redeemed_at")
          .eq("invitation_token", token)
          .single();
          
        if (invitationError || !invitation) {
          setError("Invalid or expired invitation link.");
          setIsLoading(false);
          return;
        }
        
        // Check if the invitation has already been redeemed
        if (invitation.redeemed_at) {
          setError("This invitation has already been used.");
          setIsLoading(false);
          return;
        }
        
        // Check if the invitation has expired
        if (new Date(invitation.expires_at) < new Date()) {
          setError("This invitation has expired.");
          setIsLoading(false);
          return;
        }
        
        // Get the channel name
        const { data: channel, error: channelError } = await supabase
          .from("channels")
          .select("name")
          .eq("id", invitation.channel_id)
          .single();
          
        if (channelError) {
          console.error("Error fetching channel:", channelError);
        }
        
        setInvitationData({
          id: invitation.id,
          email: invitation.email,
          channel_id: invitation.channel_id,
          channel_name: channel?.name
        });
        
        setEmail(invitation.email);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error validating invitation:", err);
        setError(err.message || "An error occurred while processing your invitation.");
        setIsLoading(false);
      }
    };
    
    fetchInvitation();
  }, [token]);
  
  // Check if the user is already logged in and handle the invitation
  useEffect(() => {
    const handleLoggedInUser = async () => {
      if (user && invitationData) {
        try {
          setIsLoading(true);
          
          // Add the user to the channel
          const { error: memberError } = await supabase
            .from("channel_members")
            .insert({
              channel_id: invitationData.channel_id,
              user_id: user.id,
              role: "member"
            });
            
          if (memberError) {
            // Check if it's just a conflict (user already in channel)
            if (memberError.code === "23505") {
              setSuccess("You are already a member of this channel.");
            } else {
              throw memberError;
            }
          } else {
            setSuccess("You have successfully joined the channel!");
          }
          
          // Mark the invitation as redeemed
          await supabase
            .from("invitations")
            .update({
              redeemed_at: new Date().toISOString(),
              redeemed_by: user.id
            })
            .eq("id", invitationData.id);
          
          // Add a delay before redirecting to the channel
          setTimeout(() => {
            router.push(`/channels/${invitationData.channel_id}`);
          }, 2000);
          
        } catch (err: any) {
          console.error("Error processing invitation for logged in user:", err);
          setError(err.message || "Failed to join the channel.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleLoggedInUser();
  }, [user, invitationData, router]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // The effect will handle the rest when the user state updates
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in.");
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !fullName) return;
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Account created! Please wait while we process your invitation...");
      // The effect will handle the rest when the user state updates
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Processing invitation...</div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="rounded-md bg-red-50 p-4 max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <div className="mt-4">
                  <Button onClick={() => router.push("/")}>Go to Home</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="rounded-md bg-green-50 p-4 max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
                <p className="mt-2 text-sm text-green-700">
                  You'll be redirected to the channel shortly...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!invitationData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>Invalid invitation</div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold">
                {mode === "signin" ? "Sign In" : "Create Account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                You've been invited to join 
                {invitationData.channel_name ? ` "${invitationData.channel_name}"` : " a channel"}
              </p>
            </div>
            
            {mode === "signin" ? (
              // Sign In Form
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="rounded-md bg-red-50 p-2">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  Sign In
                </Button>
              </form>
            ) : (
              // Sign Up Form
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="full-name">
                    Full Name
                  </label>
                  <Input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="rounded-md bg-red-50 p-2">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  Create Account
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-sm text-blue-600 hover:underline"
                type="button"
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Fallback content while the page is loading
function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="animate-pulse">Loading invitation...</div>
      </main>
    </div>
  );
}

// Main page component wrapped with Suspense
export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InviteContent />
    </Suspense>
  );
} 
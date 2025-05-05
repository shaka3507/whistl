"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, User, ExternalLink, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostgrestError } from "@supabase/supabase-js";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [importantDocuments, setImportantDocuments] = useState<File | null>(null);
  const [safeSpaceAddress, setSafeSpaceAddress] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");

  // Force a fresh profile fetch when the page loads
  useEffect(() => {
    if (user?.id) {
      const fetchFreshProfile = async () => {
        setIsCheckingAuth(true);
        try {
          // Fetch the latest profile directly from Supabase
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching fresh profile:", error);
            return;
          }

          if (data) {
            setFullName(data.full_name || "");
            setUsername(data.username || "");
            setOriginalUsername(data.username || "");
            setAvatarUrl(data.avatar_url || "");
            setNotes(data.notes || "");
            setEmailNotifications(data.email_notifications || false);
          }
        } catch (err) {
          console.error("Error in fetchFreshProfile:", err);
        } finally {
          setIsCheckingAuth(false);
        }
      };

      fetchFreshProfile();
    }
  }, [user?.id]);

  // Default profile data load from context
  useEffect(() => {
    if (!user) {
      setIsCheckingAuth(false);
      return;
    }

    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setOriginalUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
      setEmailNotifications(profile.email_notifications || false);
    }
    setIsCheckingAuth(false);
  }, [user, profile, router]);

  // Check if username is available
  const checkUsernameAvailability = async (newUsername: string) => {
    // Don't check if username hasn't changed from original
    if (newUsername === originalUsername) {
      setUsernameError("");
      return true;
    }
    
    // Don't check empty usernames
    if (!newUsername.trim()) {
      setUsernameError("");
      return true;
    }
    
    setIsCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", newUsername)
        .not("id", "eq", user?.id || "")
        .maybeSingle();
      
      if (error) throw error;
      
      const isAvailable = !data;
      if (!isAvailable) {
        setUsernameError("This username is already taken");
        return false;
      } else {
        setUsernameError("");
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      return true; // Allow submission if check fails
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [username]);

  if (isCheckingAuth) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      const { error: updateError } = await updateProfile({
        avatar_url: data.publicUrl,
      });

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Your avatar has been updated. Refresh to see all changes.",
        variant: "success",
        action: (
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="bg-white hover:bg-gray-100"
          >
            Refresh
          </Button>
        ),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Add a direct Supabase update function as a fallback
  const directProfileUpdate = async (updates: any) => {
    if (!user?.id) {
      throw new Error("User ID is required for profile update");
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);
      
    return { data, error };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username first
    if (username !== originalUsername) {
      const isUsernameAvailable = await checkUsernameAvailability(username);
      if (!isUsernameAvailable) {
        toast({
          title: "Error",
          description: "Username is already taken. Please choose a different username.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsLoading(true);

    try {
      // Only include email_notifications if it exists in the profile schema
      const updates = {
        full_name: fullName,
        username,
        notes,
      };
      
      // Check if email_notifications exists in the profile before including it
      if (profile && 'email_notifications' in profile) {
        (updates as any).email_notifications = emailNotifications;
      }

      console.log("Attempting to update profile with:", updates);
      
      // Implement retry logic for network issues
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let lastError = null;
      let usedFallback = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          // After first failure, try direct Supabase update instead
          if (retryCount >= 1) {
            console.log("Trying fallback direct Supabase update...");
            const { error } = await directProfileUpdate(updates);
            usedFallback = true;
            
            if (error) {
              console.error(`Direct profile update attempt ${retryCount + 1} error:`, error);
              lastError = error;
              retryCount++;
            } else {
              success = true;
            }
          } else {
            // First try with context function
            const { error } = await updateProfile(updates);
            
            if (error) {
              console.error(`Profile update attempt ${retryCount + 1} error:`, error);
              lastError = error;
              retryCount++;
            } else {
              success = true;
            }
          }
          
          // If not successful and we should retry
          if (!success && retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retrying profile update (${retryCount}/${maxRetries}) after ${delay}ms delay...`);
          }
        } catch (err) {
          console.error(`Profile update attempt ${retryCount + 1} exception:`, err);
          lastError = err;
          retryCount++;
          
          // Wait before retrying
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 500;
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retrying profile update (${retryCount}/${maxRetries}) after ${delay}ms delay...`);
          }
        }
      }
      
      if (!success) {
        throw lastError || new Error("Failed to update profile after multiple attempts");
      }

      // If we used the fallback, reload the page to ensure we get fresh data
      const refreshNeeded = usedFallback;

      toast({
        title: "Success",
        description: "Your profile has been updated. Refresh to see all changes.",
        variant: "success",
        action: (
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="bg-white hover:bg-gray-100"
          >
            Refresh
          </Button>
        ),
      });
      
      // If we used the fallback method, automatically refresh after a short delay
      if (refreshNeeded) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: unknown) {
      console.error("Full error object:", error);
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for network errors
      if (typeof error === 'object' && error !== null) {
        if ('message' in error && (error as any).message?.includes('fetch')) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        }
      }
      
      // Check for Supabase PostgrestError with status 409
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const pgError = error as any;
        if (pgError.code === '409' || pgError.status === 409) {
          errorMessage = "Username is already taken. Please choose a different username.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setImportantDocuments(file);
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Header />
      <div className="container py-8 mx-auto">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your profile information and avatar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={fullName || "User avatar"} />
                  <AvatarFallback>
                    {(fullName || "User")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={usernameError ? "border-red-500" : ""}
                  />
                  {isCheckingUsername && <p className="text-sm text-muted-foreground">Checking username...</p>}
                  {usernameError && <p className="text-sm text-red-500">{usernameError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="importantDocuments">Important Documents</Label>
                  <input
                    id="importantDocuments"
                    type="file"
                    onChange={handleDocumentUpload}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for alerts, messages, and polls
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="safeSpaceAddress">Address to Safe Space
                  <br/>
                  <a
                    href="https://egateway.fema.gov/ESF6/DRCLocator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    Local Disaster Recovery Centers
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                  </Label>
                  <Input
                    id="safeSpaceAddress"
                    type="text"
                    value={safeSpaceAddress}
                    onChange={(e) => setSafeSpaceAddress(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
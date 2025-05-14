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
      setAvatarUrl(profile.avatar_url || "");
      setEmailNotifications(profile.email_notifications || false);
    }
    setIsCheckingAuth(false);
  }, [user, profile, router]);

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

      // Clear user cache after avatar update
      clearUserCache();
      
      // Fetch fresh profile data to update UI without refresh
      await fetchFreshProfileData();

      toast({
        title: "Success",
        description: "Your avatar has been updated successfully.",
        variant: "success",
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
      console.error("No user ID for profile update");
      throw new Error("User ID is required for profile update");
    }
    
    console.log(`Attempting direct profile update via Supabase for user ${user.id}`, updates);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select();
      
      if (error) {
        console.error("Direct update failed:", error);
        throw error;
      }
      
      console.log("Direct update succeeded, response:", data);
      return { data, error };
    } catch (err) {
      console.error("Exception in direct profile update:", err);
      return { data: null, error: err as Error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted, starting profile update process");
    
    // Set loading state immediately to show Saving... on button
    setIsLoading(true);
    
    // Trim input values to remove leading/trailing spaces
    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim();
    
    // Debug values being submitted
    console.log("Submitting values:", {
      fullName: trimmedFullName,
      username: trimmedUsername,
      notes: notes.trim(),
      emailNotifications
    });
    
    // Validate required fields
    if (!trimmedFullName) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    if (!trimmedUsername) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Only include email_notifications if it exists in the profile schema
      const updates = {
        full_name: trimmedFullName,
        username: trimmedUsername,
        notes: notes.trim(),
      };
      
      // Check if email_notifications exists in the profile before including it
      if (profile && 'email_notifications' in profile) {
        (updates as any).email_notifications = emailNotifications;
      }

      console.log("Attempting to update profile with:", updates);
      
      // Update the form state immediately with trimmed values for better UX
      setFullName(trimmedFullName);
      setUsername(trimmedUsername);
      
      // Simple update for prototype - just try once and handle errors generically
      try {
        const { error } = await updateProfile(updates);
        
        if (error) {
          console.error("Profile update error:", error);
          // For prototype, just show a generic error
          throw error;
        }
        
        // Clear application cache
        clearUserCache();
        
        // Fetch fresh profile data
        await fetchFreshProfileData();
        
        toast({
          title: "Success",
          description: "Your profile has been updated successfully.",
          variant: "success",
        });
      } catch (error) {
        console.error("Profile update failed:", error);
        // For a prototype, handle all errors with a generic message
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
      
    } catch (error: unknown) {
      console.error("Error in profile update:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear user cache in application
  const clearUserCache = () => {
    console.log("Clearing user cache...");
    try {
      // Clear any profile-related cache from localStorage
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('profile') || 
        key.includes('whistl-profile') || 
        key.includes('user')
      );
      
      cacheKeys.forEach(key => {
        console.log(`Removing cache key: ${key}`);
        localStorage.removeItem(key);
      });
      
      console.log("User cache cleared successfully");
    } catch (err) {
      console.error("Error clearing user cache:", err);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setImportantDocuments(file);
  };

  // Function to fetch fresh profile data from the server
  const fetchFreshProfileData = async () => {
    console.log("Fetching fresh profile data from server");
    try {
      if (!user?.id) {
        console.error("No user ID for profile fetch");
        return;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching fresh profile data:", error);
        return;
      }
      
      if (data) {
        console.log("Fresh profile data received:", data);
        // Update all local state
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
        if (data.notes !== undefined) {
          setNotes(data.notes || "");
        }
        if ('email_notifications' in data) {
          setEmailNotifications(data.email_notifications || false);
        }
      }
    } catch (err) {
      console.error("Error in fetchFreshProfileData:", err);
    }
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
                  />
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
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={(e) => {
                    console.log("Save button clicked");
                    if (!isLoading) {
                      // Set loading state immediately for instant visual feedback
                      setIsLoading(true);
                      // This is a redundant handler in case the form submit doesn't trigger
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
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
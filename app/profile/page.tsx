"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostgrestError } from "@supabase/supabase-js";

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [user, profile, router]);

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
        description: "Your avatar has been updated.",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await updateProfile({
        full_name: fullName,
        username,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
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
  );
} 
"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import {
  AlertTriangle,
  Bell,
  ImageIcon,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Channel = Database["public"]["Tables"]["channels"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"] & {
  requires_acknowledgment?: boolean;
};
type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
};
type ChannelMember = Database["public"]["Tables"]["channel_members"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
};
type AlertAcknowledgment = {
  id: string;
  alert_id: string;
  user_id: string;
  acknowledged_at: string;
};
type AlertPreparationItem = {
  id: string;
  alert_id: string;
  name: string;
  quantity: number;
  created_at: string;
};

export default function ChannelPage() {
  const { id } = useParams();
  const { user, profile, isAdmin } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "member">("member");
  const [inviteEmail, setInviteEmail] = useState("");
  const [notificationText, setNotificationText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [showAcknowledgePrompt, setShowAcknowledgePrompt] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<
    string[]
  >([]);
  const [supplyItems, setSupplyItems] = useState<AlertPreparationItem[]>([]);
  const [claimedItems, setClaimedItems] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!user || !id) return;

      try {
        // Check if user is a member of this channel
        const { data: memberData, error: memberError } = await supabase
          .from("channel_members")
          .select("role")
          .eq("channel_id", id)
          .eq("user_id", user.id)
          .single();

        if (memberError) {
          throw new Error("You do not have access to this channel");
        }

        setUserRole(memberData.role);

        // Get channel details
        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("*")
          .eq("id", id)
          .single();

        if (channelError) {
          throw channelError;
        }

        setChannel(channelData);

        // Get active alert for this channel
        const { data: alertData } = await supabase
          .from("alerts")
          .select("*")
          .eq("channel_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        setAlert(alertData || null);

        // Get channel members
        const { data: membersData, error: membersError } = await supabase
          .from("channel_members")
          .select(
            `
            *,
            profiles(*)
          `
          )
          .eq("channel_id", id);

        if (membersError) {
          throw membersError;
        }

        setMembers(membersData || []);

        // Get messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(
            `
            *,
            profiles(*)
          `
          )
          .eq("channel_id", id)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw messagesError;
        }

        setMessages(messagesData || []);
      } catch (err: any) {
        console.error("Error fetching channel data:", err);
        setError(err.message || "Failed to load channel");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();

    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${id}`,
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data } = await supabase
            .from("messages")
            .select(
              `
              *,
              profiles(*)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user, id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !channel) return;

    // Check if the message is an acknowledgment command
    if (
      newMessage.trim().toLowerCase() === "acknowledge" &&
      alert &&
      !alertAcknowledged
    ) {
      await acknowledgeAlert();
      setNewMessage("");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        content: newMessage,
        is_notification: false,
      });

      if (error) {
        throw error;
      }

      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationText.trim() || !user || !channel || !isAdmin) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        content: notificationText,
        is_notification: true,
      });

      if (error) {
        throw error;
      }

      setNotificationText("");
    } catch (err: any) {
      console.error("Error sending notification:", err);
      setError(err.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user || !channel || !isAdmin) return;

    try {
      setIsSending(true);
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          channel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      // Success - show message and clear the input
      setError(null);
      setInviteEmail("");

      // Add a success notification message in the UI instead of using alert()
      const successMessage =
        data.message || `Invitation sent to ${inviteEmail}`;
      console.log(successMessage); // Log for debugging

      // Send a notification message to the channel about the invitation
      await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        content: `Invitation sent to ${inviteEmail}`,
        is_notification: true,
      });
    } catch (err: any) {
      console.error("Error inviting user:", err);
      setError(err.message || "Failed to invite user");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async () => {
    if (!isAdmin || !fileInputRef.current?.files?.length) return;

    const file = fileInputRef.current.files[0];
    setIsSending(true);

    try {
      // Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(`${channel!.id}/${Date.now()}_${file.name}`, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(fileData.path);

      // Create message with attachment
      const { error: messageError } = await supabase.from("messages").insert({
        channel_id: channel!.id,
        user_id: user!.id,
        content: `[Image] ${file.name}\n${urlData.publicUrl}`,
        is_notification: false,
        has_attachment: true,
      });

      if (messageError) {
        throw messageError;
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "Failed to upload file");
    } finally {
      setIsSending(false);
    }
  };

  const acknowledgeAlert = async () => {
    if (!user || !alert) return;

    try {
      const { error } = await supabase.from("alert_acknowledgments").upsert({
        alert_id: alert.id,
        user_id: user.id,
        acknowledged_at: new Date().toISOString(),
      });

      if (error) throw error;

      setAlertAcknowledged(true);
      setShowAcknowledgePrompt(false);
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    }
  };

  // Add this useEffect to check if user has already acknowledged the alert
  useEffect(() => {
    if (!user || !alert) return;

    const checkAcknowledgment = async () => {
      try {
        const { data, error } = await supabase
          .from("alert_acknowledgments")
          .select("*")
          .eq("alert_id", alert.id)
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking acknowledgment:", error);
          return;
        }

        // If we found an acknowledgment, user has already acknowledged
        if (data) {
          setAlertAcknowledged(true);
        } else if (
          typeof alert.requires_acknowledgment === "boolean" &&
          alert.requires_acknowledgment
        ) {
          // Only show the prompt if the alert requires acknowledgment
          setShowAcknowledgePrompt(true);
        }
      } catch (err) {
        console.error("Error in checkAcknowledgment:", err);
      }
    };

    checkAcknowledgment();
  }, [user, alert, supabase]);

  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications((prev) => [...prev, notificationId]);
  };

  useEffect(() => {
    if (!alert) return;
    
    const fetchSupplyItems = async () => {
      try {
        const { data, error } = await supabase
          .from("alert_preparation_items")
          .select("*")
          .eq("alert_id", alert.id);
          
        if (error) {
          console.error("Error fetching supply items:", error);
          return;
        }
        
        setSupplyItems(data || []);
      } catch (err) {
        console.error("Error in fetchSupplyItems:", err);
      }
    };
    
    fetchSupplyItems();
  }, [alert, supabase]);

  const claimSupplyItem = (itemId: string) => {
    setClaimedItems(prev => {
      const currentClaimed = prev[itemId] || 0;
      const item = supplyItems.find(item => item.id === itemId);
      
      if (!item || currentClaimed >= item.quantity) return prev;
      
      return {
        ...prev,
        [itemId]: currentClaimed + 1
      };
    });
  };

  const getRemainingQuantity = (item: AlertPreparationItem) => {
    const claimed = claimedItems[item.id] || 0;
    return item.quantity - claimed;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Loading channel...</div>
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
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>Channel not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="border-b w-full">
          <div className="container mx-auto flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base sm:text-lg truncate max-w-[120px] sm:max-w-none">{channel.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-between min-w-[150px]"
                  >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Members</span>
                      <span className="ml-1">{members.length}</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Channel Members</DialogTitle>
                    <DialogDescription>
                      {members.length} members in this channel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[300px] overflow-y-auto">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 py-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profiles.avatar_url || ""} />
                          <AvatarFallback>
                            {member.profiles.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {member.profiles.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.role === "admin" ? "Admin" : "Member"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isAdmin && (
                    <form onSubmit={handleInviteUser} className="mt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          type="email"
                          required
                        />
                        <Button type="submit">Invite</Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <span className="sm:inline">Claim Supplies {">"}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95%] sm:w-[80%] md:w-[70%] lg:w-[60%] max-w-[800px] h-auto sm:h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Available Supplies</DialogTitle>
                    <DialogDescription>
                      Offered by group for group members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {supplyItems.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 font-medium text-sm mb-4 border-b pb-2">
                          <div>Item</div>
                          <div>Available</div>
                          <div>Action</div>
                        </div>
                        <div className="divide-y">
                          {supplyItems.map((item) => {
                            const remainingQuantity = getRemainingQuantity(item);
                            return (
                              <div key={item.id} className="grid grid-cols-3 gap-4 py-4 items-center">
                                <div className="font-medium text-base">{item.name}</div>
                                <div className="text-base">{remainingQuantity} / {item.quantity}</div>
                                <div>
                                  {remainingQuantity > 0 ? (
                                    <Button 
                                      size="sm" 
                                      onClick={() => claimSupplyItem(item.id)}
                                      disabled={isAdmin} // Admins can't claim
                                      className="w-full sm:w-auto"
                                    >
                                      Claim
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Out of stock</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No supply items available for this alert
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              {alert && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <span className="hidden sm:inline">Alert Info</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">
                        {alert.title}
                      </DialogTitle>
                      <DialogDescription>
                        {new Date(alert.created_at).toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="font-medium mb-2">Description:</div>
                      <p className="text-sm">{alert.description}</p>
                    </div>
                    <div className="mt-4">
                      <div className="font-medium mb-2">Severity:</div>
                      <div className="inline-block px-2 py-1 rounded-full text-xs font-medium capitalize bg-red-100 text-red-800">
                        {alert.severity}
                      </div>
                    </div>

                    {alertAcknowledged && (
                      <div className="mt-4 p-2 bg-green-50 text-green-700 rounded border border-green-200">
                        ✓ You have acknowledged this alert
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    Start the conversation by sending a message below.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => {
                    const isNotification = message.is_notification;
                    const initials = message.profiles.full_name
                      ? message.profiles.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U";

                    if (
                      isNotification &&
                      !dismissedNotifications.includes(message.id)
                    ) {
                      return (
                        <div
                          key={message.id}
                          className="fixed inset-0 flex items-center justify-center z-50"
                        >
                          <div className="bg-red-300 border rounded-lg p-4 mx-4 my-auto max-w-2xl shadow-lg w-full sm:w-auto">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-black">
                                Notification from {message.profiles.full_name}
                              </span>
                            </div>
                            <p className="text-black">{message.content}</p>
                            <div className="mt-2 text-xs text-black">
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                onClick={() => dismissNotification(message.id)}
                              >
                                Acknowledge
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const hasImage =
                      message.content.includes("[Image]") &&
                      message.has_attachment;
                    let content = message.content;
                    let imageUrl = "";

                    if (hasImage) {
                      const urlMatch =
                        message.content.match(/https:\/\/[^\s]+/);
                      if (urlMatch) {
                        imageUrl = urlMatch[0];
                        content = message.content
                          .replace(imageUrl, "")
                          .replace("[Image]", "");
                      }
                    }

                    return (
                      <div key={message.id} className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={message.profiles.avatar_url || ""}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              {message.profiles.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="mt-1">
                            {hasImage ? (
                              <div className="space-y-2">
                                <p>{content}</p>
                                <div className="rounded-md overflow-hidden border">
                                  <img
                                    src={imageUrl || "/placeholder.svg"}
                                    alt="Uploaded"
                                    className="max-w-full max-h-96 object-contain"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p>{message.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="border-t p-4">
              {isAdmin && (
                <Tabs defaultValue="message" className="mb-4">
                  <TabsList>
                    <TabsTrigger value="message">Message</TabsTrigger>
                    <TabsTrigger value="notification">Notification</TabsTrigger>
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  </TabsList>
                  <TabsContent value="message">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                      />
                      <Button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="notification">
                    <form
                      onSubmit={handleSendNotification}
                      className="flex gap-2"
                    >
                      <Textarea
                        placeholder="Type an important notification..."
                        value={notificationText}
                        onChange={(e) => setNotificationText(e.target.value)}
                        disabled={isSending}
                        className="min-h-[80px]"
                      />
                      <Button
                        type="submit"
                        disabled={isSending || !notificationText.trim()}
                        className="h-10"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="upload">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        disabled={isSending}
                      />
                      <Button onClick={handleFileUpload} disabled={isSending}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {!isAdmin && (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

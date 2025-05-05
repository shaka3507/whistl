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
  BellRing,
  BellOff,
  Package,
  PackageOpen,
  ArrowLeft,
  Info,
  AlertCircle,
  Activity,
  BarChart4,
  LineChart,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  subscribeToPushNotifications 
} from '@/lib/pushNotifications';
import { Switch } from "@/components/ui/switch";
import { 
  Heart, 
  Menu,
  X,
  PanelLeft,
  Pencil,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Channel = Database["public"]["Tables"]["channels"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"] & {
  requires_acknowledgment?: boolean;
};
type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
  notification_type?: "push" | "standard";
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

// Define a new type for requested items
type RequestedItem = {
  id: string;
  channel_id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: "requested" | "approved" | "declined";
  profiles?: Database["public"]["Tables"]["profiles"]["Row"];
};

// Define new types for wellness polls
type Poll = Database["public"]["Tables"]["polls"]["Row"];
type PollResponse = Database["public"]["Tables"]["poll_responses"]["Row"];

// Define type for poll results
type PollResult = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  minValue: number;
  maxValue: number;
  stats: {
    total: number;
    average: number;
    distribution: Record<number, number>;
  };
  respondedMembers: Array<{
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    responseValue: number;
    comment: string | null;
    respondedAt: string;
  }>;
  nonRespondedMembers: Array<{
    userId: string;
    fullName: string;
    avatarUrl: string | null;
  }>;
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
  const [notificationType, setNotificationType] = useState<"push" | "standard">("push");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [showAcknowledgePrompt, setShowAcknowledgePrompt] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<
    string[]
  >([]);
  const [supplyItems, setSupplyItems] = useState<AlertPreparationItem[]>([]);
  const [claimedItems, setClaimedItems] = useState<Record<string, number>>({});
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState<boolean>(false);
  const [pushNotificationStatus, setPushNotificationStatus] = useState<string>('unchecked');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('Checking...');
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [showSuppliesView, setShowSuppliesView] = useState<boolean>(false);
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);
  // New state variables for the request item modal
  const [showRequestItemModal, setShowRequestItemModal] = useState<boolean>(false);
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  // Add new state variables inside the ChannelPage component function
  const [showWellnessView, setShowWellnessView] = useState<boolean>(false);
  const [activeWellnessPoll, setActiveWellnessPoll] = useState<Poll | null>(null);
  const [pollResponse, setPollResponse] = useState<number>(3); // Default to middle value
  const [pollComment, setPollComment] = useState<string>("");
  const [pollResults, setPollResults] = useState<PollResult[]>([]);
  const [loadingPollResults, setLoadingPollResults] = useState<boolean>(false);
  const [newPollTitle, setNewPollTitle] = useState<string>("");
  const [newPollDescription, setNewPollDescription] = useState<string>("");
  const [showCreatePollForm, setShowCreatePollForm] = useState<boolean>(false);
  const [minPollValue, setMinPollValue] = useState<number>(1);
  const [maxPollValue, setMaxPollValue] = useState<number>(5);
  const { toast } = useToast();

  // Check if running on localhost
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1');
    }
  }, []);

  // Format date as "time ago"
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Less than a minute
    if (secondsAgo < 60) {
      return 'just now';
    }
    
    // Less than an hour
    if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (secondsAgo < 604800) {
      const days = Math.floor(secondsAgo / 86400);
      if (days === 1) {
        return 'yesterday';
      }
      return `${days} days ago`;
    }
    
    // Less than a month
    if (secondsAgo < 2592000) {
      const weeks = Math.floor(secondsAgo / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year
    if (secondsAgo < 31536000) {
      const months = Math.floor(secondsAgo / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const years = Math.floor(secondsAgo / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

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

        // Get message dismissals for this user
        const { data: dismissalsData, error: dismissalsError } = await supabase
          .from("message_dismissals")
          .select("message_id")
          .eq("user_id", user.id);

        if (dismissalsError) {
          console.error("Error fetching dismissals:", dismissalsError);
        }

        // Create a set of dismissed message IDs for efficient lookup
        const dismissedMessageIds = new Set(
          (dismissalsData || []).map(dismissal => dismissal.message_id)
        );

        // Add to local dismissed notifications state
        setDismissedNotifications(Array.from(dismissedMessageIds));

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

          if (data && !dismissedNotifications.includes(data.id)) {
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

  // Check push notification permission status
  useEffect(() => {
    const checkPushNotificationStatus = async () => {
      if (!user) return;
      
      const status = await getNotificationPermissionStatus();
      setPushNotificationStatus(status);
      setPushNotificationEnabled(status === 'granted');
    };
    
    checkPushNotificationStatus();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !channel) return;

    // Check if the message is an acknowledgment command
    if (
      newMessage.trim().toLowerCase() === "acknowledge" &&
      alert &&
      !alertAcknowledged
    ) {
      console.log("acknowledge");
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
      // Check if it's a push notification
      const isPushNotification = notificationType === 'push';
      
      // Instead of inserting directly, use a server-side API to insert the message
      // This lets us use admin privileges to bypass RLS
      const messageResponse = await fetch('/api/create-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel.id,
          userId: user.id,
          content: notificationText,
          isNotification: true,
          notificationType: notificationType,
        }),
      });
      
      if (!messageResponse.ok) {
        throw new Error(`Failed to create notification: ${await messageResponse.text()}`);
      }
      
      const messageData = await messageResponse.json();
      const newMessage = messageData.message;

      if (!newMessage) {
        throw new Error('No message returned from create-notification API');
      }

      // If it's a push notification, send push notifications to all members
      if (isPushNotification) {
        console.log("Sending push notification");
        
        try {
          // Call the Supabase Edge Function to send push notifications to all channel members
          const response = await fetch('/api/send-push-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: channel.id,
              title: `${profile?.full_name || 'Admin'} sent a push notification`,
              messageBody: notificationText,
              url: `/channels/${channel.id}`
            }),
          });
          
          const result = await response.json();
          console.log('Push notification result:', result);
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
          // Continue execution even if push notification fails
        }
      }

      // Auto-dismiss the notification for the admin who sent it
      if (newMessage.id) {
        try {
          // Create a dismissal record through API endpoint to bypass RLS
          const dismissResponse = await fetch('/api/dismiss-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageId: newMessage.id,
              userId: user.id,
            }),
          });
          
          if (!dismissResponse.ok) {
            console.error('Failed to dismiss notification for admin:', await dismissResponse.text());
          } else {
            // Update local state to ensure immediate UI update
            setDismissedNotifications(prev => [...prev, newMessage.id]);
          }
        } catch (dismissError) {
          console.error('Error auto-dismissing notification:', dismissError);
        }
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
    console.log("handleInviteUser");
    e.preventDefault();
    if (!inviteEmail.trim() || !user || !channel || !isAdmin) return;

    try {
      setIsSending(true);
      setError(null);
      
      console.log("Sending invitation to:", inviteEmail.trim());
      
      // Call the new invite API endpoint
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          channelId: channel.id,
          userId: user.id, // Include user ID explicitly in case auth is an issue
        }),
        credentials: 'same-origin'
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Invitation API error:", result);
        throw new Error(result.error || `Failed to send invitation: ${response.status}`);
      }

      console.log("Invitation result:", result);

      // Clear the input field
      setInviteEmail("");
      
      // Different toast message based on whether user was added or invited
      if (result.userAdded) {
        toast({
          title: "User Added",
          description: result.message,
          variant: "default",
        });
        
        // Refresh members list since a user was added
        const { data: membersData } = await supabase
          .from("channel_members")
          .select(
            `
            *,
            profiles(*)
          `
          )
          .eq("channel_id", id);
          
        if (membersData) {
          setMembers(membersData);
        }
      } else {
        toast({
          title: "Invitation Sent",
          description: result.message,
          variant: "default",
        });
      }
      
      // If we have an invitation URL in development mode, show it
      if (result.invitationUrl) {
        console.log("Invitation URL:", result.invitationUrl);
        // For development purposes, add the URL to a secondary toast
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: "Development Info",
            description: `Invitation URL: ${result.invitationUrl}`,
            variant: "default",
          });
        }
      }
    } catch (err: any) {
      console.error("Error inviting user:", err);
      // Show error message as a toast
      toast({
        title: "Invitation Failed",
        description: err.message || "Failed to add user to the channel",
        variant: "destructive",
      });
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

  const dismissNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // Create a record of this user dismissing this notification
      const { error } = await supabase
        .from("message_dismissals")
        .insert({
          message_id: notificationId,
          user_id: user.id,
          dismissed_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error recording notification dismissal:", error);
        return;
      }
      
      // Update local state for immediate UI updates
      setDismissedNotifications((prev) => [...prev, notificationId]);
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
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

  const claimSupplyItem = async (itemId: string) => {
    const item = supplyItems.find(item => item.id === itemId);
    if (!item) return;

    const currentClaimed = claimedItems[itemId] || 0;
    if (currentClaimed >= item.quantity) return;

    try {
      const claimedQuantity = currentClaimed + 1;
      const response = await fetch('/api/claim-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, userId: user?.id, claimedQuantity }),
      });

      const data = await response.json();
      if (data.success) {
        setClaimedItems(prev => ({
          ...prev,
          [itemId]: claimedQuantity
        }));
        
        // Show success toast notification
        toast({
          title: "Item Claimed",
          description: `You've successfully claimed ${item.name}`,
          variant: "default",
        });
      } else {
        console.error("Failed to claim item:", data.error);
        // Show error toast notification
        toast({
          title: "Claim Failed",
          description: data.error || "Failed to claim item",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error claiming item:", error);
      // Show error toast notification for exception
      toast({
        title: "Error",
        description: "Something went wrong when claiming the item",
        variant: "destructive",
      });
    }
  };

  const getRemainingQuantity = (item: AlertPreparationItem) => {
    const claimed = claimedItems[item.id] || 0;
    return item.quantity - claimed;
  };

  const acknowledgeMessage = async (messageId: string) => {
    try {
      console.log("Acknowledging message with ID:", messageId);
      const response = await fetch('/api/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });
      const data = await response.json();
      console.log("Acknowledgment response:", data);
    } catch (error) {
      console.error("Error acknowledging message:", error);
    }
  };

  useEffect(() => {
    const fetchClaimedItems = async () => {
      if (!alert) return;

      try {
        const { data, error } = await supabase
          .from("claimed_supply_items")
          .select("*")
          .eq("alert_id", alert.id);

        if (error) {
          console.error("Error fetching claimed items:", error);
          return;
        }

        // Map claimed items to a dictionary for easy access
        const claimedItemsMap = data.reduce((acc, item) => {
          acc[item.item_id] = item.claimed_quantity;
          return acc;
        }, {});

        setClaimedItems(claimedItemsMap);
      } catch (err) {
        console.error("Error in fetchClaimedItems:", err);
      }
    };

    fetchClaimedItems();
  }, [alert]);

  // Function to request push notification permission
  const requestPushNotificationPermission = async () => {
    try {
      if (!user) return;
      
      await subscribeToPushNotifications(user.id);
      const status = await getNotificationPermissionStatus();
      setPushNotificationStatus(status);
      setPushNotificationEnabled(status === 'granted');
      
      if (status === 'granted') {
        // Show a success message
        setError('Push notifications enabled successfully!');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Error enabling push notifications:', err);
      setError('Failed to enable push notifications. Please try again.');
    }
  };

  // Function to check service worker status
  const checkServiceWorkerStatus = async () => {
    setServiceWorkerStatus('Checking...');
    setShowDebugInfo(true);
    
    const debugData: Record<string, any> = {
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        setServiceWorkerStatus('❌ Service Workers not supported');
        debugData.supported = false;
        setDebugInfo(debugData);
        return;
      }
      
      debugData.supported = true;
      
      // Check notification permission
      debugData.notificationPermission = Notification.permission;
      
      // Get all service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        setServiceWorkerStatus('❌ No service workers registered');
        debugData.registrations = [];
        setDebugInfo(debugData);
        return;
      }
      
      // Collect details about service workers
      const registrationDetails = registrations.map((registration, index) => {
        const details: Record<string, any> = {
          scope: registration.scope,
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          updateViaCache: registration.updateViaCache,
        };
        
        if (registration.active) {
          details.activeState = registration.active.state;
          details.activeScriptURL = registration.active.scriptURL;
        }
        
        return details;
      });
      
      debugData.registrations = registrationDetails;
      
      // Check for push subscription
      const swRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (swRegistration) {
        const subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
          debugData.pushSubscription = {
            exists: true,
            endpoint: subscription.endpoint,
          };
          setServiceWorkerStatus('✅ Service worker active with push subscription');
        } else {
          debugData.pushSubscription = { exists: false };
          setServiceWorkerStatus('⚠️ Service worker active but no push subscription');
        }
      } else {
        setServiceWorkerStatus('⚠️ No service worker found for /sw.js');
      }
      
      setDebugInfo(debugData);
    } catch (error: unknown) {
      console.error('Error checking service worker:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setServiceWorkerStatus(`❌ Error: ${errorMessage}`);
      debugData.error = errorMessage;
      setDebugInfo(debugData);
    }
  };

  // After fetchChannelData function, add this effect to fetch requested items
  useEffect(() => {
    const fetchRequestedItems = async () => {
      if (!user || !id) return;

      try {
        console.log("Fetching requested items for channel:", id);
        
        // First check if the table exists by getting the count
        const { count, error: countError } = await supabase
          .from("requested_items")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", id);
        
        if (countError) {
          console.error("Error checking requested_items table:", countError);
          // If table doesn't exist, this will likely error
          return;
        }
        
        console.log(`Found ${count} requested items in database`);
        
        // Then fetch the actual data
        const { data, error } = await supabase
          .from("requested_items")
          .select("*")
          .eq("channel_id", id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching requested items:", error);
          return;
        }

        console.log("Requested items data:", data);
        
        // If we have data but no profiles info, we need to fetch profiles separately
        if (data && data.length > 0) {
          // Get all user IDs from requested items
          const userIds = [...new Set(data.map(item => item.user_id))];
          
          // Fetch profiles for these users
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds);
            
          if (profilesError) {
            console.error("Error fetching profiles for requested items:", profilesError);
          } else if (profilesData) {
            // Create a map of user_id -> profile
            const profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
            
            // Attach profiles to requested items
            const itemsWithProfiles = data.map(item => ({
              ...item,
              profiles: profilesMap[item.user_id] || null
            }));
            
            setRequestedItems(itemsWithProfiles);
            return;
          }
        }
        
        // Default case - just set the data as-is
        setRequestedItems(data || []);
      } catch (err) {
        console.error("Error in fetchRequestedItems:", err);
      }
    };

    fetchRequestedItems();
  }, [user, id]);

  // Add the function to handle item requests
  const handleRequestItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !user || !channel) return;

    setIsSending(true);
    try {
      // Use the API endpoint to insert the requested item
      const response = await fetch('/api/request-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel.id,
          userId: user.id,
          title: newItemTitle.trim(),
          description: newItemDescription.trim() || null,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to request item');
      }

      // If successful, add to local state
      if (result.success && result.requestedItem) {
        // Create a complete item with user profile info
        const newItem: RequestedItem = {
          ...result.requestedItem,
          profiles: {
            id: user.id,
            full_name: profile?.full_name || "Unknown User",
            avatar_url: profile?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: null,
            phone_number: null
          }
        };
        
        setRequestedItems(prev => [newItem, ...prev]);
      }

      // Clear the form
      setNewItemTitle("");
      setNewItemDescription("");
      setShowRequestItemModal(false);

      // Show success message
      setError("Item requested successfully");
      setTimeout(() => setError(null), 3000);

    } catch (err: any) {
      console.error("Error requesting item:", err);
      setError(err.message || "Failed to request item");
    } finally {
      setIsSending(false);
    }
  };

  // Add these new functions before the return statement in the ChannelPage component
  const createWellnessPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollTitle.trim() || !user || !channel) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/create-wellness-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel.id,
          userId: user.id,
          title: newPollTitle.trim(),
          description: newPollDescription.trim() || null,
          minValue: minPollValue,
          maxValue: maxPollValue,
          sendPushNotification: true
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create wellness poll');
      }

      // Reset form
      setNewPollTitle("");
      setNewPollDescription("");
      setShowCreatePollForm(false);

      // Show success message
      setError("Wellness poll created successfully");
      setTimeout(() => setError(null), 3000);

      // Refresh poll results if we're in the wellness view
      if (showWellnessView) {
        fetchPollResults();
      }
    } catch (err: any) {
      console.error("Error creating wellness poll:", err);
      setError(err.message || "Failed to create wellness poll");
    } finally {
      setIsSending(false);
    }
  };

  const respondToPoll = async (pollId: string) => {
    if (!user || !pollId) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/respond-to-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId,
          userId: user.id,
          responseValue: pollResponse,
          comment: pollComment.trim() || null
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to respond to poll');
      }

      // Reset form
      setPollResponse(3);
      setPollComment("");
      setActiveWellnessPoll(null);

      // Show success message
      setError("Response submitted successfully");
      setTimeout(() => setError(null), 3000);

      // Refresh poll results if we're in the wellness view
      if (showWellnessView && isAdmin) {
        fetchPollResults();
      }
    } catch (err: any) {
      console.error("Error responding to poll:", err);
      setError(err.message || "Failed to submit response");
    } finally {
      setIsSending(false);
    }
  };

  const fetchPollResults = async () => {
    if (!user || !channel) return;

    setLoadingPollResults(true);
    try {
      // Add detailed logging for debugging
      console.log(`Fetching poll results for channel: ${channel.id}, user: ${user.id}`);
      
      const response = await fetch(`/api/get-poll-results?channelId=${channel.id}&userId=${user.id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from poll results API: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch poll results: Status ${response.status}`);
      }

      const data = await response.json();
      setPollResults(data.polls || []);
      
      if (data.polls && data.polls.length > 0) {
        console.log(`Successfully fetched ${data.polls.length} poll results`);
      } else {
        console.log('No poll results available');
      }
    } catch (err: any) {
      console.error("Error fetching poll results:", err);
      setError(err.message || "Failed to fetch poll results");
    } finally {
      setLoadingPollResults(false);
    }
  };

  // Add a useEffect to check for polls in URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const pollId = searchParams.get('poll');
      
      if (pollId && user) {
        // Fetch the poll details and show response dialog
        const fetchPoll = async () => {
          try {
            const { data: poll, error } = await supabase
              .from('polls')
              .select('*')
              .eq('id', pollId)
              .single();
            
            if (error) {
              console.error('Error fetching poll:', error);
              return;
            }
            
            if (poll) {
              setActiveWellnessPoll(poll);
              
              // Set default response value in the middle of the range
              const middleValue = Math.floor((poll.min_value + poll.max_value) / 2);
              setPollResponse(middleValue);
            }
          } catch (err) {
            console.error('Error in fetchPoll:', err);
          }
        };
        
        fetchPoll();
        
        // Clean up the URL to remove the poll parameter
        const newUrl = `${window.location.pathname}${
          window.location.search
            .replace(/[?&]poll=[^&]+/, '')
            .replace(/^&/, '?')
        }`;
        
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [user]);

  // Add this effect to fetch poll results when entering wellness view
  useEffect(() => {
    if (showWellnessView) {
      fetchPollResults();
    }
  }, [showWellnessView, channel?.id, user?.id]);

  // Add this function to fetch the original poll
  const fetchOriginalPoll = async (pollId: string) => {
    if (!user) return null;
    
    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();
        
      if (error) {
        console.error('Error fetching poll:', error);
        return null;
      }
      
      return poll;
    } catch (err) {
      console.error('Error in fetchOriginalPoll:', err);
      return null;
    }
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
          <div className="flex items-center justify-between h-14 px-2 sm:px-4 max-w-full overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-semibold text-base sm:text-lg truncate max-w-[120px] sm:max-w-none">{channel.name}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto flex-nowrap" style={{ 
              msOverflowStyle: 'none' as const, 
              scrollbarWidth: 'none' as const, 
              WebkitOverflowScrolling: 'touch' as const 
            }}>
              {isLocalhost && isPushNotificationSupported() && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-800/30 dark:hover:text-blue-400">
                      <Bell className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Notifications</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Push Notification Diagnostics</DialogTitle>
                      <DialogDescription>
                        Check if your browser is properly configured for push notifications
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <span className="bg-muted rounded-full p-1">
                              <Bell className="h-4 w-4" />
                            </span>
                            Notification Status
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Permission:</span>
                              <span className={
                                Notification.permission === 'granted' 
                                  ? "text-green-600 font-medium" 
                                  : Notification.permission === 'denied' 
                                    ? "text-red-600 font-medium" 
                                    : "text-amber-600 font-medium"
                              }>
                                {Notification.permission === 'granted' && '✓ '}
                                {Notification.permission === 'denied' && '✕ '}
                                {Notification.permission === 'default' && '? '}
                                {Notification.permission}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Push API:</span>
                              <span className={isPushNotificationSupported() ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {isPushNotificationSupported() ? '✓ Supported' : '✕ Not Supported'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-3 flex items-center gap-2">
                            <span className="bg-muted rounded-full p-1">
                              <span className="h-4 w-4 inline-block text-center text-xs">SW</span>
                            </span>
                            Service Worker
                          </h3>
                          <div className="min-h-[60px] flex flex-col justify-center">
                            {serviceWorkerStatus.includes('✅') && (
                              <div className="flex items-center text-green-600 text-sm">
                                <span className="mr-2">✓</span>
                                <span>Active and ready</span>
                              </div>
                            )}
                            {serviceWorkerStatus.includes('⚠️') && (
                              <div className="flex items-center text-amber-600 text-sm">
                                <span className="mr-2">⚠️</span>
                                <span>{serviceWorkerStatus.replace('⚠️ ', '')}</span>
                              </div>
                            )}
                            {serviceWorkerStatus.includes('❌') && (
                              <div className="flex items-center text-red-600 text-sm">
                                <span className="mr-2">✕</span>
                                <span>{serviceWorkerStatus.replace('❌ ', '')}</span>
                              </div>
                            )}
                            {serviceWorkerStatus === 'Checking...' && (
                              <div className="flex items-center text-muted-foreground text-sm">
                                <span className="animate-pulse">Checking service worker status...</span>
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={checkServiceWorkerStatus}
                            className="w-full mt-2"
                          >
                            Check Status
                          </Button>
                        </div>
                      </div>

                      {Notification.permission !== 'granted' && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                          <h3 className="font-medium mb-2">Enable Notifications</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            You'll need to grant permission to receive push notifications from this site.
                          </p>
                          <Button 
                            onClick={requestPushNotificationPermission}
                            className="w-full"
                          >
                            Request Permission
                          </Button>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowDebugInfo(!showDebugInfo)}
                            className="text-xs"
                          >
                            {showDebugInfo ? 'Hide Technical Details' : 'Show Technical Details'}
                          </Button>
                        </div>
                        
                        {showDebugInfo && (
                          <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto mt-2 max-h-[200px]">
                            {JSON.stringify(debugInfo, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors hover:bg-green-100 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-800/30 dark:hover:text-green-400"
                onClick={() => setShowSuppliesView(true)}
              >
                <Package className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Supplies</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-800/30 dark:hover:text-purple-400"
                onClick={() => setShowWellnessView(true)}
              >
                <Activity className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Wellness</span>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-800/30 dark:hover:text-purple-400">
                    <Users className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Members</span>
                    <span className="ml-1">{members.length}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Group Members</DialogTitle>
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
                  
                  {/* Display error or success message */}
                  {error && (
                    <div className={`rounded-md p-3 mt-3 break-words ${error.toLowerCase().includes('failed') || error.toLowerCase().includes('error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {error.toLowerCase().includes('failed') || error.toLowerCase().includes('error') ? (
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                          ) : (
                            <Check className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isAdmin && (
                    <>
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
                    
                    
                    </>
                  )}
                </DialogContent>
              </Dialog>
              {alert && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full transition-colors hover:bg-red-100 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-800/30 dark:hover:text-red-400">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Info</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">
                        {alert.title}
                      </DialogTitle>
                      <DialogDescription>
                        {timeAgo(alert.created_at)}
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
              {/* Conditional rendering for chat or supplies view */}
              {showWellnessView ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="border-b py-2 px-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-800/30 dark:hover:text-amber-400 mr-2 transition-colors"
                        onClick={() => setShowWellnessView(false)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="font-semibold">Wellness Check</h2>
                    </div>
                    
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCreatePollForm(true)}
                        className="flex-shrink-0"
                      >
                        <BellRing className="h-4 w-4 mr-2" />
                        New Wellness Poll
                      </Button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto flex-1 p-4">
                    <div className="max-w-3xl mx-auto">
                      {loadingPollResults ? (
                        <div className="flex justify-center p-8">
                          <div className="animate-pulse">Loading wellness data...</div>
                        </div>
                      ) : pollResults.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/20">
                          <div className="mb-2 text-muted-foreground">
                            <BarChart4 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            No wellness polls available
                          </div>
                          <p className="text-sm text-muted-foreground mb-6">
                            {isAdmin 
                              ? "Create a wellness poll to check on your group members" 
                              : "No wellness polls have been created for this channel yet"
                            }
                          </p>
                          {isAdmin && (
                            <Button 
                              onClick={() => setShowCreatePollForm(true)}
                              className="mx-auto"
                            >
                              Create Wellness Poll
                            </Button>
                          )}
                        </div>
                      ) : (
                        // Poll results display - both admin and members can see this
                        <div className="space-y-8">
                          {pollResults.map((poll) => (
                            <div key={poll.id} className="border rounded-lg overflow-hidden">
                              {/* Poll header - visible to all */}
                              <div className="bg-card p-4 border-b">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium text-lg">{poll.title}</h3>
                                    {poll.description && (
                                      <p className="text-muted-foreground mt-1">{poll.description}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-2">
                                      {timeAgo(poll.createdAt)}
                                    </div>
                                  </div>
                                  <div className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                                    {poll.stats.total} responses
                                  </div>
                                </div>
                              </div>
                            
                              {/* Poll content - different for admin vs member */}
                              <div className="p-4 bg-muted/10">
                                <div className="flex flex-col gap-4">
                                  {/* Data visualization - visible to all */}
                                  <div className="p-4 bg-background rounded-md border">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                      <span className="bg-muted-foreground/20 p-1 rounded">
                                        <LineChart className="h-4 w-4" />
                                      </span>
                                      Average: {poll.stats.average} 
                                      <span className="text-xs text-muted-foreground ml-1">
                                        (scale {poll.minValue}-{poll.maxValue})
                                      </span>
                                    </h4>
                                  
                                    <div className="mt-4">
                                      <div className="grid grid-cols-5 gap-1">
                                        {Object.entries(poll.stats.distribution).map(([value, count]) => {
                                          const percentage = poll.stats.total > 0 
                                            ? Math.round((count / poll.stats.total) * 100) 
                                            : 0;
                                          return (
                                            <div key={value} className="flex flex-col items-center">
                                              <div className="w-full bg-muted rounded-sm overflow-hidden">
                                                <div 
                                                  className="bg-blue-500 h-24" 
                                                  style={{ height: `${Math.max(4, percentage)}%` }}
                                                />
                                              </div>
                                              <div className="text-xs mt-1">{value}</div>
                                              <div className="text-xs text-muted-foreground">{count}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                
                                  {isAdmin && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Responded members */}
                                      <div className="p-4 bg-background rounded-md border">
                                        <h4 className="font-medium mb-3">Responded ({poll.respondedMembers.length})</h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                          {poll.respondedMembers.map((member) => (
                                            <div key={member.userId} className="flex items-center justify-between py-2 border-b last:border-0">
                                              <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                  <AvatarImage src={member.avatarUrl || ""} />
                                                  <AvatarFallback>
                                                    {member.fullName?.[0] || "?"}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                  <div className="text-sm font-medium">{member.fullName}</div>
                                                  {member.comment && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                      "{member.comment}"
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                                {member.responseValue}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {/* Non-responded members */}
                                      <div className="p-4 bg-background rounded-md border">
                                        <h4 className="font-medium mb-3">
                                          <span className={poll.nonRespondedMembers.length > 0 ? "text-amber-600" : ""}>
                                            Not Responded ({poll.nonRespondedMembers.length})
                                          </span>
                                        </h4>
                                        {poll.nonRespondedMembers.length > 0 ? (
                                          <div className="max-h-60 overflow-y-auto space-y-2">
                                            {poll.nonRespondedMembers.map((member) => (
                                              <div key={member.userId} className="flex items-center gap-2 py-2 border-b last:border-0">
                                                <Avatar className="h-6 w-6">
                                                  <AvatarImage src={member.avatarUrl || ""} />
                                                  <AvatarFallback>
                                                    {member.fullName?.[0] || "?"}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="text-sm">{member.fullName}</div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-6 text-muted-foreground">
                                            <div className="text-green-600 text-sm font-medium">
                                              ✓ Everyone has responded
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Member view - simplified with own response */}
                                  {!isAdmin && (
                                    <div className="p-4 bg-background rounded-md border">
                                      <h4 className="font-medium mb-3">Your Team's Wellness</h4>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        This poll has received responses from {poll.respondedMembers.length} team members.
                                        {poll.nonRespondedMembers.length > 0 && ` There are still ${poll.nonRespondedMembers.length} members who haven't responded yet.`}
                                      </p>
                                      
                                      {/* Show member's own response if they've responded */}
                                      {poll.respondedMembers.find(m => m.userId === user?.id) && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                          <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Your Response</h5>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm">
                                              You rated: <strong>{poll.respondedMembers.find(m => m.userId === user?.id)?.responseValue}</strong>
                                            </span>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={async () => {
                                                const originalPoll = await fetchOriginalPoll(poll.id);
                                                if (originalPoll) {
                                                  setActiveWellnessPoll(originalPoll);
                                                  const userResponse = poll.respondedMembers.find(m => m.userId === user?.id);
                                                  if (userResponse) {
                                                    setPollResponse(userResponse.responseValue);
                                                    setPollComment(userResponse.comment || '');
                                                  }
                                                }
                                              }}
                                            >
                                              Update Response
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Show respond button if they haven't responded yet */}
                                      {!poll.respondedMembers.find(m => m.userId === user?.id) && (
                                        <div className="mt-4 text-center">
                                          <Button
                                            onClick={async () => {
                                              const originalPoll = await fetchOriginalPoll(poll.id);
                                              if (originalPoll) {
                                                setActiveWellnessPoll(originalPoll);
                                              }
                                            }}
                                          >
                                            Respond to Poll
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : showSuppliesView ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="border-b py-2 px-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-800/30 dark:hover:text-amber-400 mr-2 transition-colors"
                        onClick={() => setShowSuppliesView(false)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="font-semibold">Group Supplies</h2>
                    </div>
                  </div>
                  
                  <div className="overflow-y-auto flex-1 p-4">
                    <div className="flex justify-end">
                      <Dialog open={showRequestItemModal} onOpenChange={setShowRequestItemModal}>
                        <DialogTrigger asChild>
                          <Button className="rounded-full px-4 bg-blue-500 mb-8">
                            Request item not listed
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request New Item</DialogTitle>
                            <DialogDescription>
                              Submit a request for an item that is not currently listed.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleRequestItem}>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <label htmlFor="item-title" className="text-sm font-medium">
                                  Item Name
                                </label>
                                <Input
                                  id="item-title"
                                  placeholder="Enter item name"
                                  value={newItemTitle}
                                  onChange={(e) => setNewItemTitle(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="item-description" className="text-sm font-medium">
                                  Description (optional)
                                </label>
                                <Textarea
                                  id="item-description"
                                  placeholder="Provide any additional details about the item"
                                  value={newItemDescription}
                                  onChange={(e) => setNewItemDescription(e.target.value)}
                                  className="min-h-[100px]"
                                />
                              </div>
                            </div>
                            <DialogFooter className="mt-6">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowRequestItemModal(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSending || !newItemTitle.trim()}
                              >
                                Submit Request
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="max-w-3xl mx-auto">
                      {supplyItems.length > 0 || requestedItems.length > 0 ? (
                        <div className="divide-y border rounded-md overflow-hidden">
                          <div className="grid grid-cols-2 bg-muted/50 text-sm font-medium p-3">
                            <div>Item</div>
                            <div className="text-right">Availability</div>
                          </div>
                          
                          {/* Render supply items */}
                          {supplyItems.map((item) => {
                            const remainingQuantity = item.quantity - (claimedItems[item.id] || 0);
                            return (
                              <div key={item.id} className="grid grid-cols-2 gap-2 p-3 items-center bg-card">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-md text-muted-foreground mt-1">
                                    {remainingQuantity > 0 
                                      ? `${remainingQuantity} of ${item.quantity} available` 
                                      : 'None available'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {remainingQuantity > 0 ? (
                                    <Button
                                      onClick={() => claimSupplyItem(item.id)}
                                      disabled={remainingQuantity <= 0}
                                      size="sm"
                                      className="rounded-full px-4 bg-green-500"
                                    >
                                      Claim
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground text-sm bg-muted px-3 py-1 rounded-full inline-block">
                                      Out of stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Render requested items */}
                          {requestedItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-2 gap-2 p-3 items-center bg-card">
                              <div>
                                <div className="font-medium">{item.title}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  Requested by {item.profiles?.full_name || "Unknown"} {timeAgo(item.created_at)}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-black text-sm bg-blue-100 px-4 py-2 rounded-full inline-block">
                                  Item requested
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border rounded-lg bg-muted/20">
                          <div className="mb-2 text-muted-foreground">
                            <PackageOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            No supplies currently available
                          </div>
                          <p className="text-sm text-muted-foreground mb-6">
                            Use the "Request item not listed" button above to request supplies you need.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowRequestItemModal(true)}
                            className="mx-auto"
                          >
                            Request an Item
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    Have a question? Ask your group. Want to give a status update? Tell your group.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => {
                    const isNotification = message.is_notification;
                    const isPushNotification = message.notification_type === 'push';
                    const initials = message.profiles.full_name
                      ? message.profiles.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U";

                    if (
                      isNotification &&
                      isPushNotification &&
                      !dismissedNotifications.includes(message.id)
                    ) {
                      return (
                        <div
                          key={message.id}
                          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        >
                          <div className="bg-background border rounded-lg p-6 pt-14 mx-4 my-auto max-w-md shadow-lg w-full transform transition-all scale-in-center relative">
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                              <div className="p-4 rounded-full bg-red-100 border-4 border-white shadow-md">
                                <Bell className="h-12 w-12 text-red-600" />
                              </div>
                            </div>
                            
                            <div className="text-center mb-4">
                              <h3 className="text-lg font-semibold mt-4">Alert</h3>
                              <div className="text-xs text-muted-foreground">
                                {timeAgo(message.created_at)}
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-start gap-3">
                                <div>
                                  <p className="text-sm mt-1">{message.content}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-center mt-4 pt-2 border-t">
                              <Button
                                size="lg"
                                onClick={() => {
                                  acknowledgeMessage(message.id);
                                  dismissNotification(message.id);
                                }}
                                className="rounded-full px-6"
                              >
                                Acknowledge
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Display standard notifications inline
                    if (isNotification && !isPushNotification && !dismissedNotifications.includes(message.id)) {
                      return (
                        <div key={message.id} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800 mb-4">
                          <div className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="font-medium text-sm">
                                  Alert
                                </div>
                                <div className="text-xs text-muted-foreground ml-2">
                                  {timeAgo(message.created_at)}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => dismissNotification(message.id)}
                                className="h-6 px-3 rounded-full text-xs"
                              >
                                Dismiss
                              </Button>
                            </div>
                            <div className="mt-1 flex items-start gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="text-xs text-muted-foreground">From:</span>
                                  <span className="text-xs font-medium">{message.profiles.full_name}</span>
                                </div>
                                <p className="text-sm">{message.content}</p>
                              </div>
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
                              {timeAgo(message.created_at)}
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
                      <Button type="submit" disabled={isSending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="notification">
                    <form
                      onSubmit={handleSendNotification}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-sm font-medium">Push Notification:</div>
                        <Switch
                          id="notification-type-switch"
                          checked={notificationType === 'push'}
                          onCheckedChange={(checked) => 
                            setNotificationType(checked ? 'push' : 'standard')
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {notificationType === 'push' ? 'Push' : 'Standard'}
                        </span>
                      </div>
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
                        className="h-10 w-fit ml-auto"
                      >
                        Send {notificationType === 'push' ? 'Push' : 'Standard'} Notification
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
      
      {/* Create Poll Modal */}
      <Dialog open={showCreatePollForm} onOpenChange={setShowCreatePollForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Wellness Poll</DialogTitle>
            <DialogDescription>
              Create a new wellness check poll for channel members
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createWellnessPoll}>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="poll-title" className="text-sm font-medium">
                  Poll Title
                </label>
                <Input
                  id="poll-title"
                  placeholder="e.g., Daily Wellness Check"
                  value={newPollTitle}
                  onChange={(e) => setNewPollTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="poll-description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="poll-description"
                  placeholder="How are you feeling today? Rate your wellness from 1-5"
                  value={newPollDescription}
                  onChange={(e) => setNewPollDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="min-value" className="text-sm font-medium">
                    Minimum Value
                  </label>
                  <Input
                    id="min-value"
                    type="number"
                    min="1"
                    max="9"
                    value={minPollValue}
                    onChange={(e) => setMinPollValue(parseInt(e.target.value, 10))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="max-value" className="text-sm font-medium">
                    Maximum Value
                  </label>
                  <Input
                    id="max-value"
                    type="number"
                    min="2"
                    max="10"
                    value={maxPollValue}
                    onChange={(e) => setMaxPollValue(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePollForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSending || !newPollTitle.trim() || minPollValue >= maxPollValue}
              >
                Create Poll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Respond to Poll Modal */}
      <Dialog open={!!activeWellnessPoll} onOpenChange={(open) => !open && setActiveWellnessPoll(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wellness Check</DialogTitle>
            {activeWellnessPoll?.description && (
              <DialogDescription>
                {activeWellnessPoll.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <h3 className="text-lg font-medium mb-2">{activeWellnessPoll?.title}</h3>
            
            <div className="my-6">
              <div className="flex justify-center items-center gap-4 mb-2">
                <span className="text-sm font-medium">{activeWellnessPoll?.min_value || 1}</span>
                <div className="flex-1 flex items-center">
                  {Array.from({ length: (activeWellnessPoll?.max_value || 5) - (activeWellnessPoll?.min_value || 1) + 1 }).map((_, i) => {
                    const value = (activeWellnessPoll?.min_value || 1) + i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPollResponse(value)}
                        className={`flex-1 h-12 flex items-center justify-center rounded-full mx-1 ${
                          pollResponse === value
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm font-medium">{activeWellnessPoll?.max_value || 5}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="poll-comment" className="text-sm font-medium block mb-2">
                Additional Comments (optional)
              </label>
              <Textarea
                id="poll-comment"
                placeholder="Share how you're doing..."
                value={pollComment}
                onChange={(e) => setPollComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setActiveWellnessPoll(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => activeWellnessPoll && respondToPoll(activeWellnessPoll.id)}
              disabled={isSending}
            >
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

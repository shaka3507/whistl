"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/header";
import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { 
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  subscribeToPushNotifications 
} from '@/lib/pushNotifications';

// Import our new components
import ChannelHeader from "@/components/channel/ChannelHeader";
import ChatView from "@/components/channel/ChatView";
import SuppliesView from "@/components/channel/SuppliesView";
import WellnessView from "@/components/channel/WellnessView";

// Leave the type definitions at the top as they were
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
type Poll = Database["public"]["Tables"]["polls"]["Row"];
type PollResponse = Database["public"]["Tables"]["poll_responses"]["Row"];
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
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [inviteError, setInviteError] = useState<string | null>(null);
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
  const [showSuppliesView, setShowSuppliesView] = useState<boolean>(false);
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);
  const [showRequestItemModal, setShowRequestItemModal] = useState<boolean>(false);
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  const [showWellnessView, setShowWellnessView] = useState<boolean>(false);
  const [activeWellnessPoll, setActiveWellnessPoll] = useState<Poll | null>(null);
  const [pollResponse, setPollResponse] = useState<number>(3);
  const [pollComment, setPollComment] = useState<string>("");
  const [pollResults, setPollResults] = useState<PollResult[]>([]);
  const [loadingPollResults, setLoadingPollResults] = useState<boolean>(false);
  const [newPollTitle, setNewPollTitle] = useState<string>("");
  const [newPollDescription, setNewPollDescription] = useState<string>("");
  const [showCreatePollForm, setShowCreatePollForm] = useState<boolean>(false);
  const [minPollValue, setMinPollValue] = useState<number>(1);
  const [maxPollValue, setMaxPollValue] = useState<number>(5);
  const [justClaimedItems, setJustClaimedItems] = useState<Set<string>>(new Set());
  const [userClaimedItems, setUserClaimedItems] = useState<Set<string>>(new Set());
  const [showUserItems, setShowUserItems] = useState<boolean>(true);
  const [claimingItemIds, setClaimingItemIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Add a current view state to manage which view is active
  const [currentView, setCurrentView] = useState<'chat' | 'supplies' | 'wellness'>('chat');

  // Main useEffect to fetch channel data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if the user is a member of this channel
        const { data: memberData, error: memberError } = await supabase
          .from("channel_members")
          .select("role")
          .eq("channel_id", id)
          .eq("user_id", user.id)
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError;
        }

        const isChannelMember = !!memberData;
        const userRole = memberData?.role || "member";
        setUserRole(userRole as "admin" | "member");

        // Fetch the channel data
        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("*")
          .eq("id", id)
          .single();

        if (channelError) {
          throw channelError;
        }

        setChannel(channelData);

        // Fetch the active alert for this channel
        const { data: alertData, error: alertError } = await supabase
          .from("alerts")
          .select("*")
          .eq("channel_id", id)
          .eq("is_active", true)
          .single();

        if (alertError && alertError.code !== 'PGRST116') {
          console.error("Error fetching alert:", alertError);
          // Don't throw here, we can continue without the alert
        } else {
          setAlert(alertData || null);
          
          // If there's an active alert, check if the current user has acknowledged it
          if (alertData && alertData.requires_acknowledgment) {
            // First check localStorage for cached acknowledgment to avoid flicker on refresh
            const localAcks = JSON.parse(localStorage.getItem('alertAcknowledgments') || '{}');
            if (localAcks[alertData.id]) {
              setAlertAcknowledged(true);
              setShowAcknowledgePrompt(false);
            } else {
              // If not in localStorage, check the database
              const { data: ackData, error: ackError } = await supabase
                .from("alert_acknowledgments")
                .select("*")
                .eq("alert_id", alertData.id)
                .eq("user_id", user.id)
                .single();
                
              if (ackError && ackError.code !== 'PGRST116') {
                console.error("Error fetching alert acknowledgment:", ackError);
              } else if (ackData) {
                // Store in localStorage for future fast lookups
                localAcks[alertData.id] = true;
                localStorage.setItem('alertAcknowledgments', JSON.stringify(localAcks));
                setAlertAcknowledged(true);
                setShowAcknowledgePrompt(false);
              } else {
                setAlertAcknowledged(false);
                setShowAcknowledgePrompt(alertData.requires_acknowledgment);
              }
            }
          }
        }

        // Fetch channel members
        const { data: membersData, error: membersError } = await supabase
          .from("channel_members")
          .select(`
            *,
            profiles(*)
          `)
          .eq("channel_id", id)
          .order("role", { ascending: false });

        if (membersError) {
          console.error("Error fetching members:", membersError);
          // Continue without members data
        } else {
          setMembers(membersData || []);
        }

        // Fetch messages
        await fetchMessages();

        // Fetch supply items if they exist
        if (alertData) {
          const { data: supplyItemsData, error: supplyItemsError } = await supabase
            .from("alert_preparation_items")
            .select("*")
            .eq("alert_id", alertData.id)
            .order("name");

          if (supplyItemsError) {
            console.error("Error fetching supply items:", supplyItemsError);
          } else {
            setSupplyItems(supplyItemsData || []);
          }
          
          // Fetch claimed supply items to determine what's already claimed
          const { data: claimedItemsData, error: claimedItemsError } = await supabase
            .from("claimed_supply_items")
            .select("*")
            .eq("alert_id", alertData.id);
            
          if (claimedItemsError) {
            console.error("Error fetching claimed items:", claimedItemsError);
          } else if (claimedItemsData) {
            // Create a map to count claimed quantities for each item
            const claimedItemsMap: Record<string, number> = {};
            
            // Track which items this user has claimed
            const userClaimed = new Set<string>();
            
            claimedItemsData.forEach(claim => {
              // Count total claimed quantities
              const itemId = claim.item_id;
              claimedItemsMap[itemId] = (claimedItemsMap[itemId] || 0) + claim.claimed_quantity;
              
              // Mark items claimed by the current user
              if (claim.user_id === user.id) {
                userClaimed.add(itemId);
              }
            });
            
            setClaimedItems(claimedItemsMap);
            setUserClaimedItems(userClaimed);
          }
        }

        // Fetch requested items
        const { data: requestedItemsData, error: requestedItemsError } = await supabase
          .from("requested_items")
          .select("*")
          .eq("channel_id", id)
          .order("created_at", { ascending: false });

        if (requestedItemsError) {
          console.error("Error fetching requested items:", requestedItemsError);
        } else {
          setRequestedItems(requestedItemsData || []);
        }

        // Check if this alert has been dismissed by the current user
        const { data: alertDismissed, error: dismissError } = await supabase
          .from("alert_dismissals")
          .select("*")
          .eq("alert_id", alertData.id)
          .eq("user_id", user.id)
          .single();
        
        if (dismissError && dismissError.code !== 'PGRST116') {
          console.error("Error checking alert dismissal:", dismissError);
        } else if (alertDismissed) {
          // If this alert was dismissed, redirect to channels page
          window.location.href = "/channels";
          return;
        }

      } catch (err: any) {
        console.error("Error fetching channel data:", err);
        setError(err.message || "Failed to load channel data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // Function to fetch messages
  const fetchMessages = async () => {
    if (!id) return;
    
    try {
      // Get the messages for this channel
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("channel_id", id)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (!data) {
        setMessages([]);
        return;
      }

      // If the user is logged in, fetch their message dismissals
      if (user) {
        // Fetch message dismissals - we use this table for both dismiss and acknowledge operations
        const { data: dismissals, error: dismissError } = await supabase
          .from("message_dismissals")
          .select("message_id")
          .eq("user_id", user.id);

        if (dismissError) {
          console.error("Error fetching dismissals:", dismissError);
        }
        
        // Convert dismissals to a set for quick lookup
        const dismissedMessageIds = new Set(
          dismissals?.map((dismissal) => dismissal.message_id) || []
        );

        console.log("Fetched dismissed message IDs:", Array.from(dismissedMessageIds));
        
        // Set the dismissed notifications in state
        setDismissedNotifications(Array.from(dismissedMessageIds));

        // Mark messages as acknowledged based on whether they've been dismissed
        // For our purposes, a dismissed message is also considered acknowledged
        const messagesWithAck = data.map((message) => ({
          ...message,
          isAcknowledged: dismissedMessageIds.has(message.id),
        }));

        setMessages(messagesWithAck);
      } else {
        setMessages(data);
      }
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(err.message);
    }
  };

  // Function to send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel || !newMessage.trim()) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) {
        throw error;
      }

      setNewMessage("");
      await fetchMessages();
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Function to handle user invitations
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel || !inviteEmail.trim()) return;

    // Store whether this specific invitation attempt has completed
    let invitationCompleted = false;
    
    setInviteStatus("sending");
    setInviteError(null);
    
    // Safety timeout - ensure we don't stay in "sending" state forever
    const safetyTimeout = setTimeout(() => {
      if (!invitationCompleted) {
        console.warn("Invitation request timed out after 10 seconds");
        setInviteStatus("idle");
        setInviteError("Request timed out. Please try again.");
      }
    }, 10000); // 10 seconds timeout

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Abort fetch after 8 seconds
      
      const response = await fetch("/api/send-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          channelId: channel.id,
          userId: user.id
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation");
      }

      invitationCompleted = true;
      setInviteEmail("");
      setInviteStatus("sent");
      
      // Reset invite status after 2 seconds
      setTimeout(() => {
        setInviteStatus("idle");
      }, 2000);
      
      // If a user was actually added (existing user), refresh members
      if (result.userAdded) {
        const { data: membersData } = await supabase
          .from("channel_members")
          .select(`
            *,
            profiles(*)
          `)
          .eq("channel_id", channel.id)
          .order("role", { ascending: false });
          
        if (membersData) {
          setMembers(membersData);
        }
      }
    } catch (err: any) {
      invitationCompleted = true;
      console.error("Error inviting user:", err);
      if (err.name === 'AbortError') {
        setInviteError("Request timed out. Please try again.");
      } else {
        setInviteError(err.message || "Failed to send invitation");
      }
      setInviteStatus("idle");
    } finally {
      // Always clear the safety timeout
      clearTimeout(safetyTimeout);
    }
  };

  // Function to handle sending notifications
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel || !notificationText.trim()) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        content: notificationText.trim(),
        is_notification: true,
        notification_type: notificationType
      });

      if (error) {
        throw error;
      }

      // Also trigger email notifications
      await fetch("/api/send-channel-email-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel.id,
          senderId: user.id,
          message: notificationText.trim(),
          type: "notification"
        }),
      });

      setNotificationText("");
      await fetchMessages();
      
      toast({
        title: "Notification sent",
        description: "All channel members have been notified",
      });
    } catch (err: any) {
      console.error("Error sending notification:", err);
      setError(err.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  // Function to dismiss notifications
  const dismissNotification = async (messageId: string) => {
    if (!user) return;
    
    try {
      // First, update the local state for immediate feedback
      setDismissedNotifications((prev) => [...prev, messageId]);
      
      // Use upsert instead of insert to handle the case where the notification is already dismissed
      const { error } = await supabase.from("message_dismissals").upsert({
        message_id: messageId,
        user_id: user.id,
        dismissed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'message_id,user_id',
        ignoreDuplicates: true
      });

      if (error) {
        console.error("Error dismissing message:", error);
        // If there was an error, revert the local state change
        setDismissedNotifications((prev) => prev.filter(id => id !== messageId));
        
        toast({
          title: "Error",
          description: "Failed to dismiss notification. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error dismissing message:", err);
      // Revert the optimistic update if there was an error
      setDismissedNotifications((prev) => prev.filter(id => id !== messageId));
    }
  };

  // Function to acknowledge messages
  const acknowledgeMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      // First, update the local state for immediate feedback
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, isAcknowledged: true } : msg
        )
      );
      
      // Also update the dismissedNotifications state
      setDismissedNotifications((prev) => [...prev, messageId]);
      
      // Use upsert instead of insert to handle the case where the message is already acknowledged
      const { error } = await supabase.from("message_dismissals").upsert({
        message_id: messageId,
        user_id: user.id,
        dismissed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'message_id,user_id',
        ignoreDuplicates: true
      });

      if (error) {
        console.error("Error acknowledging message:", error);
        toast({
          title: "Error",
          description: "Failed to acknowledge notification. Please try again.",
          variant: "destructive",
        });
        
        // Revert the optimistic update if there was an error
        await fetchMessages();
      } else {
        toast({
          title: "Notification acknowledged",
          description: "Your acknowledgment has been recorded.",
        });
      }
    } catch (err) {
      console.error("Error acknowledging message:", err);
      // Revert the optimistic update if there was an error
      await fetchMessages();
    }
  };

  // Function to handle item requests
  const handleRequestItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel || !newItemTitle.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const { error } = await supabase.from("requested_items").insert({
        channel_id: channel.id,
        user_id: user.id,
        title: newItemTitle.trim(),
        description: newItemDescription.trim() || null,
        status: "requested"
      });

      if (error) {
        throw error;
      }

      // Refresh requested items
      const { data } = await supabase
        .from("requested_items")
        .select("*")
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: false });
        
      setRequestedItems(data || []);

      // Reset form and close modal
      setNewItemTitle("");
      setNewItemDescription("");
      setShowRequestItemModal(false);

      toast({
        title: "Item requested",
        description: "Your request has been submitted to the channel admins",
      });
    } catch (err: any) {
      console.error("Error requesting item:", err);
      setError(err.message || "Failed to request item");
    } finally {
      setIsSending(false);
    }
  };

  // Function to claim supply items
  const claimSupplyItem = async (itemId: string) => {
    if (!user || !channel || !alert) return;
    
    try {
      setClaimingItemIds(prev => new Set([...prev, itemId]));
      
      // First, check if this item is already claimed
      const { data: existingClaim, error: checkError } = await supabase
        .from("claimed_supply_items")
        .select("*")
        .eq("item_id", itemId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw checkError;
      }
      
      if (existingClaim) {
        // Item already claimed - could be by this user or another user
        if (existingClaim.user_id === user.id) {
          toast({
            title: "Already claimed",
            description: "You've already claimed this item",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Item unavailable",
            description: "This item has already been claimed by someone else",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Find the item to get its quantity
      const item = supplyItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error("Item not found");
      }
      
      // Use RLS policies to ensure only one user can claim successfully
      const { error } = await supabase.from("claimed_supply_items").insert({
        item_id: itemId,
        user_id: user.id,
        alert_id: alert.id,
        claimed_quantity: 1, // Default to 1, or use a dynamic quantity if your UI allows it
        claimed_at: new Date().toISOString()
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation - user already claimed or race condition
          toast({
            title: "Already claimed",
            description: "This item has just been claimed",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        // Update local state to reflect the claim
        setJustClaimedItems(prev => new Set([...prev, itemId]));
        setUserClaimedItems(prev => new Set([...prev, itemId]));
        
        toast({
          title: "Item claimed",
          description: "You've claimed this item"
        });
        
        // Refresh data to ensure UI is in sync with the database
        fetchMessages();
        
        // Re-fetch supply items
        if (alert) {
          const { data: supplyItemsData, error: supplyItemsError } = await supabase
            .from("alert_preparation_items")
            .select("*")
            .eq("alert_id", alert.id)
            .order("name");
            
          if (!supplyItemsError && supplyItemsData) {
            setSupplyItems(supplyItemsData);
          }
        }
      }
    } catch (err: any) {
      console.error("Error claiming item:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to claim item",
        variant: "destructive"
      });
    } finally {
      setClaimingItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Helper function to check if user is a member
  const isUserChannelMember = () => {
    if (!user) return false;
    return members.some(member => member.user_id === user.id);
  };

  // Functions for wellness polls
  const createWellnessPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channel || !newPollTitle.trim()) return;

    setIsSending(true);

    try {
      const { data, error } = await supabase.from("polls").insert({
        channel_id: channel.id,
        created_by: user.id,
        title: newPollTitle.trim(),
        description: newPollDescription.trim() || null,
        min_value: minPollValue,
        max_value: maxPollValue
      }).select().single();

      if (error) {
        throw error;
      }

      // Create a notification about the new poll
      await supabase.from("messages").insert({
        channel_id: channel.id,
        user_id: user.id,
        content: `New wellness check: "${newPollTitle.trim()}"`,
        is_notification: true
      });

      // Reset form and close it
      setNewPollTitle("");
      setNewPollDescription("");
      setShowCreatePollForm(false);
      setActiveWellnessPoll(data);

      toast({
        title: "Wellness check created",
        description: "All members will be asked to respond"
      });
    } catch (err: any) {
      console.error("Error creating poll:", err);
      setError(err.message || "Failed to create wellness check");
    } finally {
      setIsSending(false);
    }
  };

  const fetchOriginalPoll = async (pollId: string) => {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("id", pollId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error("Error fetching poll:", err);
      return null;
    }
  };

  const respondToPoll = async (pollId: string) => {
    if (!user || !channel || !activeWellnessPoll) return;

    // Don't allow poll creators to respond to their own polls
    if (activeWellnessPoll.created_by === user.id) {
      toast({
        title: "Cannot respond",
        description: "You cannot respond to polls you created.",
        variant: "destructive"
      });
      setActiveWellnessPoll(null);
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.from("poll_responses").insert({
        poll_id: pollId,
        user_id: user.id,
        response_value: pollResponse,
        comment: pollComment.trim() || null
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Response recorded",
        description: "Thank you for your feedback"
      });

      // Reset the active poll after response
      setActiveWellnessPoll(null);
      setPollResponse(3);
      setPollComment("");
      
    } catch (err: any) {
      console.error("Error responding to poll:", err);
      setError(err.message || "Failed to record your response");
    } finally {
      setIsSending(false);
    }
  };

  // Watch for view state changes 
  useEffect(() => {
    // Update the boolean flags based on the currentView state
    setShowSuppliesView(currentView === 'supplies');
    setShowWellnessView(currentView === 'wellness');
  }, [currentView]);

  // A helper for readability - returns the component for the current view
  const getViewComponent = () => {
    if (!user || !channel) return null;

    // Show loading placeholder during initial load
    if (isLoading) {
      return <div className="h-full flex items-center justify-center">Loading...</div>
    }

    switch (currentView) {
      case 'chat':
        return (
          <ChatView
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            isAdmin={isAdmin}
            isSending={isSending}
            notificationText={notificationText}
            setNotificationText={setNotificationText}
            notificationType={notificationType}
            setNotificationType={setNotificationType}
            handleSendNotification={handleSendNotification}
            dismissedNotifications={dismissedNotifications}
            dismissNotification={dismissNotification}
            acknowledgeMessage={acknowledgeMessage}
            isUserChannelMember={isUserChannelMember()}
            messagesEndRef={messagesEndRef}
            filterAdminNotifications={true}
          />
        );
      case 'supplies':
        return (
          <SuppliesView 
            supplyItems={supplyItems}
            claimingItemIds={claimingItemIds}
            justClaimedItems={justClaimedItems}
            userClaimedItems={userClaimedItems}
            showUserItems={showUserItems}
            setShowUserItems={setShowUserItems}
            claimSupplyItem={claimSupplyItem}
            requestedItems={requestedItems}
            showRequestItemModal={showRequestItemModal}
            setShowRequestItemModal={setShowRequestItemModal}
            newItemTitle={newItemTitle}
            setNewItemTitle={setNewItemTitle}
            newItemDescription={newItemDescription}
            setNewItemDescription={setNewItemDescription}
            handleRequestItem={handleRequestItem}
            isSending={isSending}
            isAdmin={isAdmin || userRole === 'admin'}
          />
        );
      case 'wellness':
        return (
          <WellnessView
            activeWellnessPoll={activeWellnessPoll}
            pollResponse={pollResponse}
            setPollResponse={setPollResponse}
            pollComment={pollComment}
            setPollComment={setPollComment}
            respondToPoll={respondToPoll}
            isAdmin={isAdmin || userRole === 'admin'}
            newPollTitle={newPollTitle}
            setNewPollTitle={setNewPollTitle}
            newPollDescription={newPollDescription}
            setNewPollDescription={setNewPollDescription}
            showCreatePollForm={showCreatePollForm}
            setShowCreatePollForm={setShowCreatePollForm}
            createWellnessPoll={createWellnessPoll}
            isSending={isSending}
            pollResults={pollResults}
            loadingPollResults={loadingPollResults}
            minPollValue={minPollValue}
            setMinPollValue={setMinPollValue}
            maxPollValue={maxPollValue}
            setMaxPollValue={setMaxPollValue}
            fetchOriginalPoll={fetchOriginalPoll}
            user={user}
          />
        );
      default:
        return <div>Select a view</div>;
    }
  };

  // Add a new function to acknowledge alerts
  const acknowledgeAlert = async () => {
    if (!user || !alert) return;
    
    try {
      // First, update the local state for immediate feedback
      setAlertAcknowledged(true);
      setShowAcknowledgePrompt(false);
      
      // Store in localStorage for persistence between refreshes
      const localAcks = JSON.parse(localStorage.getItem('alertAcknowledgments') || '{}');
      localAcks[alert.id] = true;
      localStorage.setItem('alertAcknowledgments', JSON.stringify(localAcks));
      
      // Insert the acknowledgment in the database
      const { error } = await supabase.from("alert_acknowledgments").insert({
        alert_id: alert.id,
        user_id: user.id,
        acknowledged_at: new Date().toISOString()
      });

      if (error) {
        console.error("Error acknowledging alert:", error);
        toast({
          title: "Error",
          description: "Failed to acknowledge alert. Please try again.",
          variant: "destructive",
        });
        
        // Revert the optimistic update if there was an error
        setAlertAcknowledged(false);
        setShowAcknowledgePrompt(true);
        
        // Remove from localStorage
        const localAcks = JSON.parse(localStorage.getItem('alertAcknowledgments') || '{}');
        delete localAcks[alert.id];
        localStorage.setItem('alertAcknowledgments', JSON.stringify(localAcks));
      } else {
        toast({
          title: "Alert acknowledged",
          description: "Your acknowledgment has been recorded.",
        });
      }
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      // Revert the optimistic update if there was an error
      setAlertAcknowledged(false);
      setShowAcknowledgePrompt(true);
    }
  };

  // Add a new function to dismiss alerts
  const dismissAlert = async (alertId: string) => {
    if (!user || !alert) return;
    
    try {
      // Insert the dismissal in the database
      const { error } = await supabase.from("alert_dismissals").insert({
        alert_id: alertId,
        user_id: user.id,
        dismissed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error("Error dismissing alert:", error);
        toast({
          title: "Error",
          description: "Failed to dismiss alert. Please try again.",
          variant: "destructive",
        });
      } else {
        // Navigate back to channels list
        window.location.href = "/channels";
        
        toast({
          title: "Alert dismissed",
          description: "This alert has been dismissed.",
        });
      }
    } catch (err) {
      console.error("Error dismissing alert:", err);
    }
  };

  // Function to dismiss admin notifications
  const dismissAdminNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // First update local state for immediate feedback
      setDismissedNotifications(prev => [...prev, notificationId]);
      
      console.log("Dismissing admin notification:", notificationId);
      console.log("Updated local dismissedNotifications:", [...dismissedNotifications, notificationId]);
      
      // Use upsert instead of insert to handle the case where the notification is already dismissed
      const { error } = await supabase.from("message_dismissals").upsert({
        message_id: notificationId,
        user_id: user.id,
        dismissed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'message_id,user_id',
        ignoreDuplicates: true
      });

      if (error) {
        console.error("Error dismissing admin notification:", error);
        // Revert local state if there was an error
        setDismissedNotifications(prev => prev.filter(id => id !== notificationId));
        
        toast({
          title: "Error",
          description: "Failed to dismiss notification. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error dismissing admin notification:", err);
      // Revert local state if there was an error
      setDismissedNotifications(prev => prev.filter(id => id !== notificationId));
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
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <div>
              <h3 className="text-lg font-semibold text-red-600">Error</h3>
              <p className="mt-2">{error}</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => window.location.href = "/channels"}
              >
                Back to Channels
              </Button>
            </div>
          </div>
        ) : (
          <>
            {channel && (
              <ChannelHeader
                channel={channel}
                alert={alert}
                members={members}
                isAdmin={isAdmin || userRole === "admin"}
                error={error}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                handleInviteUser={handleInviteUser}
                currentView={currentView}
                setCurrentView={setCurrentView}
                inviteStatus={inviteStatus}
                inviteError={inviteError}
                alertAcknowledged={alertAcknowledged}
                showAcknowledgePrompt={showAcknowledgePrompt}
                acknowledgeAlert={acknowledgeAlert}
                dismissAlert={dismissAlert}
                dismissAdminNotification={dismissAdminNotification}
                dismissedNotifications={dismissedNotifications}
              />
            )}
            <div className="flex-1 overflow-hidden flex flex-col">
              {getViewComponent()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/header";
import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

      // If the user is logged in, fetch their message acknowledgments
      if (user) {
        const { data: acknowledgments, error: ackError } = await supabase
          .from("message_acknowledgments")
          .select("message_id")
          .eq("user_id", user.id);

        if (ackError) {
          console.error("Error fetching acknowledgments:", ackError);
        }

        // Convert acknowledgments to a set for quick lookup
        const acknowledgedMessageIds = new Set(
          acknowledgments?.map((ack) => ack.message_id) || []
        );

        // Mark messages as acknowledged or not
        const messagesWithAck = data.map((message) => ({
          ...message,
          isAcknowledged: acknowledgedMessageIds.has(message.id),
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
    setDismissedNotifications((prev) => [...prev, messageId]);
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
      
      // Insert the acknowledgment in the database
      const { error } = await supabase.from("message_acknowledgments").insert({
        message_id: messageId,
        user_id: user.id,
        acknowledged_at: new Date().toISOString()
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
    if (!user || !channel) return;
    
    try {
      setClaimingItemIds(prev => new Set([...prev, itemId]));
      
      const { error } = await supabase.from("claimed_items").insert({
        item_id: itemId,
        user_id: user.id,
        channel_id: channel.id
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation - user already claimed
          toast({
            title: "Already claimed",
            description: "You've already claimed this item",
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

    setIsSending(true);

    try {
      const { error } = await supabase.from("poll_responses").insert({
        poll_id: pollId,
        user_id: user.id,
        value: pollResponse,
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
    switch (currentView) {
      case 'supplies':
        return (
          <SuppliesView
            supplyItems={supplyItems}
            claimedItems={claimedItems}
            justClaimedItems={justClaimedItems}
            userClaimedItems={userClaimedItems}
            claimingItemIds={claimingItemIds}
            showUserItems={showUserItems}
            setShowUserItems={setShowUserItems}
            claimSupplyItem={claimSupplyItem}
            requestedItems={requestedItems}
            user={user}
            showRequestItemModal={showRequestItemModal}
            setShowRequestItemModal={setShowRequestItemModal}
            newItemTitle={newItemTitle}
            setNewItemTitle={setNewItemTitle}
            newItemDescription={newItemDescription}
            setNewItemDescription={setNewItemDescription}
            handleRequestItem={handleRequestItem}
            isSending={isSending}
          />
        );
      case 'wellness':
        return (
          <WellnessView
            isAdmin={isAdmin}
            pollResults={pollResults}
            loadingPollResults={loadingPollResults}
            showCreatePollForm={showCreatePollForm}
            setShowCreatePollForm={setShowCreatePollForm}
            newPollTitle={newPollTitle}
            setNewPollTitle={setNewPollTitle}
            newPollDescription={newPollDescription}
            setNewPollDescription={setNewPollDescription}
            minPollValue={minPollValue}
            setMinPollValue={setMinPollValue}
            maxPollValue={maxPollValue}
            setMaxPollValue={setMaxPollValue}
            createWellnessPoll={createWellnessPoll}
            isSending={isSending}
            activeWellnessPoll={activeWellnessPoll}
            setActiveWellnessPoll={setActiveWellnessPoll}
            pollResponse={pollResponse}
            setPollResponse={setPollResponse}
            pollComment={pollComment}
            setPollComment={setPollComment}
            respondToPoll={respondToPoll}
            fetchOriginalPoll={fetchOriginalPoll}
            user={user}
          />
        );
      case 'chat':
      default:
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
          />
        );
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
        {/* Use the new header component */}
        <ChannelHeader 
          channel={channel}
          alert={alert}
          members={members}
          isAdmin={isAdmin}
          error={error}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          handleInviteUser={handleInviteUser}
          currentView={currentView}
          setCurrentView={setCurrentView}
          inviteStatus={inviteStatus}
          inviteError={inviteError}
        />

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Render the appropriate component based on the current view */}
          {getViewComponent()}
        </div>
      </main>
    </div>
  );
}

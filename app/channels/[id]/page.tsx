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

  // Keep the existing useEffects from the original page component 
  // ... (all of the original useEffects and functions)

  // Keep all the original functions (handleSendMessage, handleSendNotification, etc.)
  // from the original component, as they'll be passed to our new components
  
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
            isUserChannelMember={isUserChannelMember}
          />
        );
    }
  };

  // Watch for view state changes 
  useEffect(() => {
    // Update the boolean flags based on the currentView state
    setShowSuppliesView(currentView === 'supplies');
    setShowWellnessView(currentView === 'wellness');
  }, [currentView]);

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
        />

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Render the appropriate component based on the current view */}
          {getViewComponent()}
        </div>
      </main>
    </div>
  );
}

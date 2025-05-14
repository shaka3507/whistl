"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users,
  MessageSquare,
  Package,
  Activity,
  Bell,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/lib/supabase-types";
import { timeAgo } from "./utils";
import { supabase } from "@/lib/supabase";

type Channel = Database["public"]["Tables"]["channels"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"] & {
  requires_acknowledgment?: boolean;
};
type ChannelMember = Database["public"]["Tables"]["channel_members"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
};

interface ChannelHeaderProps {
  channel: Channel;
  alert: Alert | null;
  members: ChannelMember[];
  isAdmin: boolean;
  error: string | null;
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  handleInviteUser: (e: React.FormEvent) => Promise<void>;
  currentView: 'chat' | 'supplies' | 'wellness';
  setCurrentView: (view: 'chat' | 'supplies' | 'wellness') => void;
  inviteStatus: "idle" | "sending" | "sent";
  inviteError: string | null;
  alertAcknowledged: boolean;
  showAcknowledgePrompt: boolean;
  acknowledgeAlert: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  dismissAdminNotification: (notificationId: string) => Promise<void>;
}

export default function ChannelHeader({
  channel,
  alert,
  members,
  isAdmin,
  error,
  inviteEmail,
  setInviteEmail,
  handleInviteUser,
  currentView,
  setCurrentView,
  inviteStatus,
  inviteError,
  alertAcknowledged,
  showAcknowledgePrompt,
  acknowledgeAlert,
  dismissAlert,
  dismissAdminNotification
}: ChannelHeaderProps) {
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
  
  // Fetch admin notifications
  useEffect(() => {
    const fetchAdminNotifications = async () => {
      setLoadingNotifications(true);
      try {
        // Get only the 2 most recent admin notifications for this channel
        const { data, error } = await supabase
          .from("messages")
          .select(`
            id,
            content,
            created_at,
            profiles:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq("channel_id", channel.id)
          .eq("is_notification", true)
          .order("created_at", { ascending: false })
          .limit(2);
          
        if (error) {
          console.error("Error fetching admin notifications:", error);
        } else {
          setAdminNotifications(data || []);
        }
      } catch (err) {
        console.error("Error in fetching admin notifications:", err);
      } finally {
        setLoadingNotifications(false);
      }
    };
    
    fetchAdminNotifications();
  }, [channel.id]);
  
  // Add a safety mechanism to ensure invite button doesn't get stuck in sending state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (inviteStatus === "sending") {
      timeoutId = setTimeout(() => {
        console.warn("Invite button has been in sending state for too long, resetting UI...");
        // We can't directly modify inviteStatus here as it's a prop,
        // but we can close the dialog which will reset the UI
        setMembersDialogOpen(false);
      }, 15000); // 15 seconds is plenty of time for any reasonable network request
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inviteStatus]);
  
  // Handle notification dismissal
  const handleDismissNotification = (notificationId: string) => {
    setDismissedNotificationIds(prev => new Set([...prev, notificationId]));
    // Call the parent function to persist to database
    dismissAdminNotification(notificationId);
  };
  
  // Filter out dismissed notifications
  const visibleNotifications = adminNotifications.filter(
    notification => !dismissedNotificationIds.has(notification.id)
  );

  return (
    <div className="border-b w-full">
      {/* Admin Notifications Section */}
      {visibleNotifications.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-3 relative min-h-[80px]">
          <div className="space-y-0">
            {visibleNotifications.map((notification, index) => {
              // Only show the top two notifications in the staggered view
              if (index > 1) return null;
              
              // First notification (index 0) is on top, second (index 1) is partially visible behind it
              const isTopNotification = index === 0;
              
              return (
                <div 
                  key={notification.id} 
                  className={`
                    flex items-start justify-between text-sm
                    bg-white dark:bg-slate-800 
                    border border-blue-200 dark:border-blue-800 
                    rounded-md p-3 
                    transition-all duration-300 ease-in-out
                    ${isTopNotification 
                      ? 'relative z-10 shadow-md' 
                      : `absolute top-9 left-8 right-8 z-0 opacity-85 shadow-sm
                         transform translate-y-1 rotate-[-1deg]`
                    }
                  `}
                >
                  <div className="flex items-start gap-2 max-w-[calc(100%-36px)]">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <div className="font-medium text-blue-800 dark:text-blue-300 truncate">
                        {notification.profiles.full_name}
                      </div>
                      <div className="line-clamp-2">{notification.content}</div>
                      <div className="text-xs text-muted-foreground">
                        {timeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDismissNotification(notification.id)}
                    className="h-6 w-6 p-0 rounded-full flex-shrink-0"
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          {/* Add count indicator if there are more than 2 notifications */}
          {visibleNotifications.length > 2 && (
            <div className="absolute bottom-2 right-4 text-xs font-medium text-blue-600 dark:text-blue-400">
              +{visibleNotifications.length - 2} more
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between h-14 px-2 sm:px-4 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-semibold text-base sm:text-lg truncate max-w-[120px] sm:max-w-none">{channel.name}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto flex-nowrap" style={{ 
          msOverflowStyle: 'none' as const, 
          scrollbarWidth: 'none' as const, 
          WebkitOverflowScrolling: 'touch' as const 
        }}>
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors ${
              currentView === 'chat'
                ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-800/30 dark:text-blue-400" 
                : "hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-800/30 dark:hover:text-blue-400"
            }`}
            onClick={() => setCurrentView('chat')}
          >
            <MessageSquare className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors ${
              currentView === 'supplies'
                ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-400" 
                : "hover:bg-green-100 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-800/30 dark:hover:text-green-400"
            }`}
            onClick={() => setCurrentView('supplies')}
          >
            <Package className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Supplies</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-shrink-0 px-2 sm:px-3 rounded-full transition-colors ${
              currentView === 'wellness'
                ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-800/30 dark:text-purple-400" 
                : "hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-800/30 dark:hover:text-purple-400"
            }`}
            onClick={() => setCurrentView('wellness')}
          >
            <Activity className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Wellness</span>
          </Button>
          <Dialog 
            open={membersDialogOpen} 
            onOpenChange={(open) => {
              setMembersDialogOpen(open);
              // If dialog is closing and invite is still in progress, reset the email field
              if (!open && inviteStatus === "sending") {
                setInviteEmail("");
              }
            }}
          >
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
              
              {/* Only display general error messages, not invitation success messages */}
              {error && error.toLowerCase().includes('failed') && (
                <div className="rounded-md bg-red-50 p-3 mt-3 break-words">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {isAdmin && (
                <form onSubmit={handleInviteUser} className="mt-4">
                  <div className="flex gap-2">
                    <input
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      type="email"
                      required
                      disabled={inviteStatus !== "idle"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button 
                      type="submit"
                      disabled={inviteStatus !== "idle" && inviteStatus !== "sent"}
                      className={inviteStatus === "sent" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {inviteStatus === "sending" ? (
                        <span className="flex items-center gap-1">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                          Sending...
                        </span>
                      ) : inviteStatus === "sent" ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Sent!
                        </span>
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                  {inviteError && (
                    <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{inviteError}</span>
                    </div>
                  )}
                </form>
              )}
            </DialogContent>
          </Dialog>
          {alert && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0 px-2 sm:px-3 rounded-full bg-red-100 text-red-700 border-red-300 hover:bg-red-200">
                  <Bell className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Alert</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">
                    {alert.title}
                  </DialogTitle>
                  <DialogDescription>
                    {alert.description}
                    <div className="text-xs text-gray-500 mt-1">
                      Issued {timeAgo(alert.created_at)}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 border-t pt-4 flex flex-col gap-3">
                  {/* Only show acknowledge button if acknowledgment is required and not already acknowledged */}
                  {alert.requires_acknowledgment && (
                    <div>
                      {alertAcknowledged ? (
                        <div className="flex items-center text-green-600 gap-2">
                          <Check className="h-5 w-5" />
                          <span>You have acknowledged this alert</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={acknowledgeAlert}
                          className="w-full"
                        >
                          Acknowledge Alert
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Add Dismiss button */}
                  <Button 
                    variant="outline"
                    onClick={() => dismissAlert(alert.id)}
                    className="w-full"
                  >
                    Dismiss Alert
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
} 
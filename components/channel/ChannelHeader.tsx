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
  Check
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
  inviteError
}: ChannelHeaderProps) {
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  
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

  return (
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
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
} 
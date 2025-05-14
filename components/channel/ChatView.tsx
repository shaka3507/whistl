"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bell } from "lucide-react";
import type { Database } from "@/lib/supabase-types";
import { timeAgo } from "./utils";
import { ClientOnly } from "@/components/client-only";

interface Message {
  id: string;
  created_at: string;
  content: string;
  is_notification: boolean;
  notification_type?: "push" | "standard";
  user_id: string;
  channel_id: string;
  parent_id?: string;
  has_attachment?: boolean;
  profiles: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  isAcknowledged?: boolean;
  requires_acknowledgment?: boolean;
}

interface ChatViewProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  isAdmin: boolean;
  isSending: boolean;
  notificationText: string;
  setNotificationText: (value: string) => void;
  notificationType: "push" | "standard";
  setNotificationType: (value: "push" | "standard") => void;
  handleSendNotification: (e: React.FormEvent) => Promise<void>;
  dismissedNotifications: string[];
  dismissNotification: (id: string) => Promise<void>;
  acknowledgeMessage: (id: string) => Promise<void>;
  isUserChannelMember: boolean;
  filterAdminNotifications?: boolean;
}

export default function ChatView({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  isAdmin,
  isSending,
  notificationText,
  setNotificationText,
  notificationType,
  setNotificationType,
  handleSendNotification,
  dismissedNotifications,
  dismissNotification,
  acknowledgeMessage,
  isUserChannelMember,
  filterAdminNotifications = true,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modified: Keep all messages regardless of notification status
  const filteredMessages = filterAdminNotifications
    ? messages.filter(message => 
        // Only filter out dismissed messages
        !dismissedNotifications.includes(message.id)
      )
    : messages;
    
  // Auto-scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages.length]);

  // Debug logging for dismissed notifications
  useEffect(() => {
    console.log("Dismissed notification IDs:", dismissedNotifications);
  }, [dismissedNotifications]);

  return (
    <div className="flex flex-col h-full">
      {/* Make the messages container take all available space and be scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Have a question? Ask your group. Want to give a status update? Tell your group.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMessages.map((message) => {
              const initials = message.profiles.full_name
                ? message.profiles.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "U";

              // Display acknowledgment buttons for messages that require it
              const needsAcknowledgment = message.requires_acknowledgment && !message.isAcknowledged;

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
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {message.profiles.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <ClientOnly>
                            {timeAgo(message.created_at)}
                          </ClientOnly>
                        </div>
                      </div>
                      
                      {/* Add buttons for acknowledgment and dismissal if needed */}
                      {(message.requires_acknowledgment || message.is_notification) && (
                        <div className="flex items-center gap-2">
                          {message.requires_acknowledgment && (
                            <div className="flex items-center">
                              {message.isAcknowledged ? (
                                <div className="flex items-center text-green-600 gap-1 text-xs">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Acknowledged</span>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => acknowledgeMessage(message.id)}
                                  className="h-6 px-3 rounded-full text-xs"
                                >
                                  Acknowledge
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
            <div ref={messagesEndRef} className="h-px" />
          </div>
        )}
      </div>
      
      {/* Make the chat input fixed at the bottom and ensure it doesn't scroll with content */}
      <div className="border-t p-4 bg-background flex-shrink-0">
        {isAdmin ? (
          <Tabs defaultValue="message" className="mb-4">
            <TabsList>
              <TabsTrigger value="message">Message</TabsTrigger>
              <TabsTrigger value="notification">Notification</TabsTrigger>
            </TabsList>
            <TabsContent value="message">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                  className="min-h-10" // Ensure consistent height
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
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-sm font-medium">Push Notification:</div>
                  <div className="relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-muted transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-background shadow-lg transform ring-0 transition duration-200 ease-in-out ${
                        notificationType === 'push' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                      onClick={() => setNotificationType(notificationType === 'push' ? 'standard' : 'push')}
                    />
                  </div>
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
                  <Bell className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        ) : isUserChannelMember ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="min-h-10" // Ensure consistent height
            />
            <Button
              type="submit"
              disabled={isSending || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center text-muted-foreground py-2 text-sm">
            You are not a member of this channel and cannot send messages.
          </div>
        )}
      </div>
    </div>
  );
} 
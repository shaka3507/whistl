"use client";

import { useState, useRef } from "react";
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
  isUserChannelMember
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
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
                          <ClientOnly>
                            {timeAgo(message.created_at)}
                          </ClientOnly>
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
                        {message.isAcknowledged ? (
                          <div className="flex items-center text-green-600 gap-2">
                            <CheckCircle className="h-5 w-5" />
                            <span>Acknowledged</span>
                          </div>
                        ) : (
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
                        )}
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
                            <ClientOnly>
                              {timeAgo(message.created_at)}
                            </ClientOnly>
                          </div>
                        </div>
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => dismissNotification(message.id)}
                            className="h-6 px-3 rounded-full text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
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
                        <ClientOnly>
                          {timeAgo(message.created_at)}
                        </ClientOnly>
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
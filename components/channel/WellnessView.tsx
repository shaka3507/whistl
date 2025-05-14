"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart4, LineChart } from "lucide-react";
import { BellRing } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase-types";
import { timeAgo } from "./utils";

type Poll = Database["public"]["Tables"]["polls"]["Row"];

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

interface WellnessViewProps {
  isAdmin: boolean;
  pollResults: PollResult[];
  loadingPollResults: boolean;
  showCreatePollForm: boolean;
  setShowCreatePollForm: (value: boolean) => void;
  newPollTitle: string;
  setNewPollTitle: (value: string) => void;
  newPollDescription: string;
  setNewPollDescription: (value: string) => void;
  minPollValue: number;
  setMinPollValue: (value: number) => void;
  maxPollValue: number;
  setMaxPollValue: (value: number) => void;
  createWellnessPoll: (e: React.FormEvent) => Promise<void>;
  isSending: boolean;
  activeWellnessPoll: Poll | null;
  setActiveWellnessPoll: (poll: Poll | null) => void;
  pollResponse: number;
  setPollResponse: (value: number) => void;
  pollComment: string;
  setPollComment: (value: string) => void;
  respondToPoll: (pollId: string) => Promise<void>;
  fetchOriginalPoll: (pollId: string) => Promise<Poll | null>;
  user: any;
}

export default function WellnessView({
  isAdmin,
  pollResults,
  loadingPollResults,
  showCreatePollForm,
  setShowCreatePollForm,
  newPollTitle,
  setNewPollTitle,
  newPollDescription,
  setNewPollDescription,
  minPollValue,
  setMinPollValue,
  maxPollValue,
  setMaxPollValue,
  createWellnessPoll,
  isSending,
  activeWellnessPoll,
  setActiveWellnessPoll,
  pollResponse,
  setPollResponse,
  pollComment,
  setPollComment,
  respondToPoll,
  fetchOriginalPoll,
  user
}: WellnessViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b py-2 px-4 flex justify-end">
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
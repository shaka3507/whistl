"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/supabase-types";
import { timeAgo } from "./utils";

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

interface SuppliesViewProps {
  supplyItems: AlertPreparationItem[];
  claimedItems: Record<string, number>;
  justClaimedItems: Set<string>;
  userClaimedItems: Set<string>;
  claimingItemIds: Set<string>;
  showUserItems: boolean;
  setShowUserItems: (value: boolean) => void;
  claimSupplyItem: (itemId: string) => Promise<void>;
  requestedItems: RequestedItem[];
  user: any;
  showRequestItemModal: boolean;
  setShowRequestItemModal: (value: boolean) => void;
  newItemTitle: string;
  setNewItemTitle: (value: string) => void;
  newItemDescription: string;
  setNewItemDescription: (value: string) => void;
  handleRequestItem: (e: React.FormEvent) => Promise<void>;
  isSending: boolean;
  isAdmin?: boolean;
}

export default function SuppliesView({
  supplyItems,
  claimedItems,
  justClaimedItems,
  userClaimedItems,
  claimingItemIds,
  showUserItems,
  setShowUserItems,
  claimSupplyItem,
  requestedItems,
  user,
  showRequestItemModal,
  setShowRequestItemModal,
  newItemTitle,
  setNewItemTitle,
  newItemDescription,
  setNewItemDescription,
  handleRequestItem,
  isSending,
  isAdmin = false
}: SuppliesViewProps) {
  
  // Helper function to get remaining quantity
  const getRemainingQuantity = (item: AlertPreparationItem) => {
    const claimed = claimedItems && claimedItems[item.id] ? claimedItems[item.id] : 0;
    return item.quantity - claimed;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="overflow-y-auto flex-1 p-4">
        {/* Always show "I need something not listed" button at the top */}
        <div className="flex justify-end mb-6">
          <Dialog open={showRequestItemModal} onOpenChange={setShowRequestItemModal}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-4 bg-blue-500">
                I need something not listed
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
        
        {/* User's Items Section as a Collapsible */}
        {(userClaimedItems.size > 0 || requestedItems.some(item => item.user_id === user?.id)) && (
          <div className="mb-6 border rounded-lg overflow-hidden">
            <button 
              className="w-full bg-blue-50 dark:bg-blue-900/20 p-3 border-b flex items-center justify-between"
              onClick={() => setShowUserItems(!showUserItems)}
            >
              <h3 className="font-medium">Your Items</h3>
              <div className="text-muted-foreground">
                {showUserItems ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>
            
            {showUserItems && (
              <div className="divide-y">
                {/* User's claimed items */}
                {userClaimedItems.size > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-3">Items You've Claimed</h4>
                    <div className="space-y-2">
                      {Array.from(userClaimedItems).map(itemId => {
                        const item = supplyItems.find(i => i.id === itemId);
                        return item ? (
                          <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-md border">
                            <div>
                              <div className="font-medium">{item.name}</div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Claimed
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {/* User's requested items */}
                {requestedItems.some(item => item.user_id === user?.id) && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-3">Items You've Requested</h4>
                    <div className="space-y-2">
                      {requestedItems
                        .filter(item => item.user_id === user?.id)
                        .map(item => (
                          <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-md border">
                            <div>
                              <div className="font-medium">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">{timeAgo(item.created_at)}</div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Requested
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Available supplies list */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 bg-muted/50 text-sm font-medium p-3">
            <div>Item</div>
            <div className="text-right">Availability</div>
          </div>
          
          {/* Render supply items */}
          {supplyItems.map((item) => {
            const remainingQuantity = getRemainingQuantity(item);
            const hasJustClaimed = justClaimedItems.has(item.id);
            const userHasClaimed = userClaimedItems.has(item.id);
            const isBeingClaimed = claimingItemIds.has(item.id);
            const isUnavailable = remainingQuantity <= 0;
            
            return (
              <div key={item.id} className="grid grid-cols-2 gap-2 p-3 items-center bg-card">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-md text-muted-foreground mt-1">
                    {remainingQuantity > 0 
                      ? `${remainingQuantity} of ${item.quantity} available` 
                      : 'None available'}
                  </div>
                  {userHasClaimed && (
                    <div className="text-xs text-green-600 mt-1">
                      You've claimed this item
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {remainingQuantity > 0 ? (
                    <Button
                      onClick={() => claimSupplyItem(item.id)}
                      disabled={isUnavailable || hasJustClaimed || userHasClaimed || isBeingClaimed}
                      size="sm"
                      className={`rounded-full px-4 ${
                        isBeingClaimed 
                          ? 'bg-blue-500 cursor-not-allowed' 
                          : (hasJustClaimed || userHasClaimed) 
                            ? 'bg-green-700' 
                            : 'bg-green-500'
                      }`}
                    >
                      {isBeingClaimed ? (
                        <>
                          <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full inline-block"></span>
                          Claiming...
                        </>
                      ) : hasJustClaimed || userHasClaimed ? (
                        <>
                          <span className="mr-1">✓</span>
                          Claimed
                        </>
                      ) : (
                        'Claim'
                      )}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm bg-muted px-3 py-1 rounded-full inline-block">
                      Not available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
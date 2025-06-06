"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

type Channel = {
  id: string
  name: string
  description: string
  alerts: {
    id: string
    title: string
    description: string
    severity: string
    status: string
    items: {
      id: string
      name: string
      quantity: number
      claimed_by: string | null
    }[]
  }[]
}

export default function ChannelsPage() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimingItems, setClaimingItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return;

      try {
        // Fetch channels the user is a member of
        const { data, error } = await supabase
          .from("channel_members")
          .select(`
            channel:channels(*)
          `)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        // Extract channels from the response
        const userChannels = data.map((member) => member.channel);
        setChannels(userChannels || []);
        
        // After setting channels, check which items are claimed
        if (userChannels && userChannels.length > 0) {
          // Get all alert IDs from all channels
          const alertIds = userChannels.flatMap(channel => 
            channel.alerts ? channel.alerts.map(alert => alert.id) : []
          );
          
          if (alertIds.length > 0) {
            // Fetch claimed supply items for these alerts
            const { data: claimedData, error: claimedError } = await supabase
              .from("claimed_supply_items")
              .select("*")
              .in("alert_id", alertIds);
              
            if (claimedError) {
              console.error("Error fetching claimed items:", claimedError);
            } else if (claimedData && claimedData.length > 0) {
              // Process the claimed items
              // For now we just log them - we could update the UI based on this data
              console.log("Claimed items found:", claimedData.length);
            }
          }
        }
      } catch (err: any) {
        console.error("Error fetching channels:", err);
        setError(err.message || "Failed to load channels");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, [user]);

  const handleClaimItem = async (channelId: string, alertId: string, itemId: string) => {
    if (!user) return
    
    // Prevent multiple clicks by checking if this item is already being claimed
    if (claimingItems.has(itemId)) return
    
    try {
      // Set the loading state for this item
      setClaimingItems(prev => new Set([...prev, itemId]))
      
      // First check if the item is already claimed in the claimed_supply_items table
      const { data: existingClaim, error: checkError } = await supabase
        .from("claimed_supply_items")
        .select("*")
        .eq("item_id", itemId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw checkError;
      }
      
      if (existingClaim) {
        // Item already claimed
        console.log("Item already claimed")
        
        // Provide user feedback through a notification or alert
        // (You would likely want to add a toast component here)
        
        return
      }
      
      // Insert into claimed_supply_items table with a unique constraint
      const { error } = await supabase
        .from("claimed_supply_items")
        .insert({
          item_id: itemId,
          user_id: user.id,
          alert_id: alertId,
          claimed_quantity: 1, // Default to 1, or use a dynamic quantity if your UI allows it
          claimed_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log("Item was claimed by someone else just now")
          // Add user feedback (toast notification)
          return
        }
        throw error
      }
      
      // Just refetch the channels directly using the same method as the initial load
      const fetchUpdatedChannels = async () => {
        try {
          // Fetch channels the user is a member of
          const { data, error } = await supabase
            .from("channel_members")
            .select(`
              channel:channels(*)
            `)
            .eq("user_id", user.id);

          if (error) {
            throw error;
          }

          // Extract channels from the response
          const userChannels = data.map((member) => member.channel);
          setChannels(userChannels || []);
        } catch (err: any) {
          console.error("Error refreshing channels:", err);
        }
      };

      // Refresh the channels
      await fetchUpdatedChannels();
    } catch (error) {
      console.error("Error claiming item:", error)
    } finally {
      // Always remove the loading state when done, whether successful or not
      setClaimingItems(prev => {
        const updatedSet = new Set(prev)
        updatedSet.delete(itemId)
        return updatedSet
      })
    }
  }

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="container py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="container py-8">
          <div className="space-y-4">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div>
        <Header />
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-4">Current Alerts</h1>
          <p className="text-gray-500">No active alerts.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">My alerts</h1>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse">Loading alerts...</div>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No channels found.
            </div>
          ) : (
            <div className="grid gap-4">
              {channels.map((channel) => (
                <Card key={channel.id}>
                  <CardHeader>
                    <CardTitle>{channel.name}</CardTitle>
                    <CardDescription>{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/channels/${channel.id}`}>
                      <Button variant="outline" size="sm">
                        Join chat
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


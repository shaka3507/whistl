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

    try {
      const { error } = await supabase
        .from("alert_items")
        .update({ claimed_by: user.id })
        .eq("id", itemId)
        .eq("alert_id", alertId)
        .eq("channel_id", channelId)

      if (error) throw error

      // Refresh the channels data
      const { data: updatedChannels, error: channelError } = await supabase
        .from("channels")
        .select(`
          id,
          name,
          description,
          alerts (
            id,
            title,
            description,
            severity,
            status,
            items (
              id,
              name,
              quantity,
              claimed_by
            )
          )
        `)
        .in(
          "id",
          channels.map((c) => c.id)
        )

      if (channelError) throw channelError
      setChannels(updatedChannels || [])
    } catch (error) {
      console.error("Error claiming item:", error)
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


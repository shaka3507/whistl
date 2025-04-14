"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  const router = useRouter()

  useEffect(() => {
    async function fetchChannels() {
      if (!user) return

      try {
        // First, get all channels the user is a member of
        const { data: memberData, error: memberError } = await supabase
          .from("channel_members")
          .select("channel_id")
          .eq("user_id", user.id)

        if (memberError) throw memberError

        if (!memberData || memberData.length === 0) {
          setChannels([])
          setIsLoading(false)
          return
        }

        // Then, get the channel details along with their alerts
        const { data: channelData, error: channelError } = await supabase
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
            memberData.map((m) => m.channel_id)
          )

        if (channelError) throw channelError

        setChannels(channelData || [])
      } catch (error) {
        console.error("Error fetching channels:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannels()
  }, [user])

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

  if (channels.length === 0) {
    return (
      <div>
        <Header />
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-4">My Channels</h1>
          <p className="text-gray-500">You are not a member of any channels yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">My Channels</h1>
        <div className="grid gap-6">
          {channels.map((channel) => (
            <Card key={channel.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardTitle className="text-xl mb-2">{channel.name}</CardTitle>
                    <p className="text-gray-500">{channel.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/channels/${channel.id}`)}
                  >
                    View Details
                  </Button>
                </div>

                {channel.alerts.length > 0 ? (
                  <div className="space-y-4">
                    {channel.alerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {alert.severity === "high" ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : alert.severity === "medium" ? (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                          )}
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge
                            variant={
                              alert.status === "active"
                                ? "default"
                                : alert.status === "resolved"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-4">{alert.description}</p>
                        
                        {alert.items.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Available Items</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead>Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {alert.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                      {item.name}
                                      {item.quantity > 0 && (
                                        <span className="text-sm text-gray-500 ml-2">
                                          ({item.quantity} available)
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {item.quantity > 0 ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleClaimItem(channel.id, alert.id, item.id)}
                                          disabled={!!item.claimed_by}
                                        >
                                          {item.claimed_by ? "Claimed" : "Claim"}
                                        </Button>
                                      ) : (
                                        <Button size="sm" variant="outline" disabled>
                                          Out of Stock
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No active alerts in this channel.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


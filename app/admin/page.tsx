"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { AlertTriangle, MessageSquare, Plus, Phone, Smartphone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertPreparationItems } from "@/components/ui/alert-preparation-items"
import Link from "next/link"
import type { Database } from "@/lib/supabase-types"

type Channel = Database["public"]["Tables"]["channels"]["Row"] & {
  alerts: Database["public"]["Tables"]["alerts"]["Row"][] | null
}

type User = Database["public"]["Tables"]["profiles"]["Row"] & {
  last_message_time?: string | null
  email?: string
  is_admin?: boolean
  avatar_url?: string | null
  phone_number?: string | null
  blocked?: boolean
}

// Define a new type for requested items
type RequestedItem = {
  id: string
  channel_id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  status: "requested" | "approved" | "declined"
  profiles?: Database["public"]["Tables"]["profiles"]["Row"]
}

// Define a type for grouping requested items by channel
type RequestedItemsByChannel = {
  channel: Channel
  items: RequestedItem[]
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [channelName, setChannelName] = useState("")
  const [channelDescription, setChannelDescription] = useState("")
  const [preparationItems, setPreparationItems] = useState<Array<{
    template_id: number;
    name: string;
    quantity: number;
    unit: string;
    selected: boolean;
  }>>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  // Add new state for requested items
  const [requestedItemsByChannel, setRequestedItemsByChannel] = useState<RequestedItemsByChannel[]>([])
  const [isLoadingRequestedItems, setIsLoadingRequestedItems] = useState(true)
  const [requestedItemsError, setRequestedItemsError] = useState<string | null>(null)

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Make sure the user is authenticated and admin
      if (!user || !isAdmin) {
        throw new Error("You must be an admin to create alerts")
      }

      // First create a channel
      const { data: channelData, error: channelError } = await supabase
        .from("channels")
        .insert({
          name: channelName || title,
          description: channelDescription || description,
          created_by: user.id,
        })
        .select()
        .single()

      if (channelError) {
        throw channelError
      }

      // Add the current user as admin to the channel
      await supabase.from("channel_members").insert({
        channel_id: channelData.id,
        user_id: user.id,
        role: "admin",
      })

      // Create the alert
      const { data: alertData, error: alertError } = await supabase.from("alerts").insert({
        title,
        description,
        severity,
        created_by: user.id,
        is_active: true,
        channel_id: channelData.id,
      }).select().single()

      if (alertError) {
        throw alertError
      }

      // Create alert preparation items if any are selected
      if (preparationItems.length > 0) {
        const alertItems = preparationItems.map(item => ({
          alert_id: alertData.id,
          template_item_id: item.template_id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit
        }))
        
        const { error: itemsError } = await supabase
          .from("alert_preparation_items")
          .insert(alertItems)
          
        if (itemsError) {
          console.error("Error saving preparation items:", itemsError)
          // Continue anyway - we don't want to fail the alert creation if items fail
        }
      }

      // Set loading state to false
      setIsLoading(false)
      
      // Store channel ID for navigation and use window.location for hard navigation
      // to avoid potential Next.js router redirect loops
      const channelId = channelData.id
      window.location.href = `/channels/${channelId}`
      
      return // Early return to skip the finally block
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return

      try {
        // Get all channels with their alerts
        const { data, error } = await supabase
          .from("channels")
          .select(`
            *,
            alerts(*)
          `)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setChannels(data || [])
      } catch (err: any) {
        console.error("Error fetching channels:", err)
        setError(err.message || "Failed to load channels")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannels()
  }, [user])

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return

      try {
        // Get all users and their last message times
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *,
            messages!messages_user_id_fkey (
              created_at
            )
          `)
          .neq('id', user.id) // Exclude current user
          .order("username", { ascending: true })

        if (error) {
          throw error
        }

        // Process the data to get the most recent message time for each user
        const processedUsers = data.map(user => ({
          ...user,
          last_message_time: user.messages && user.messages.length > 0 
            ? user.messages.reduce((latest: string, msg: { created_at: string }) => 
                new Date(msg.created_at) > new Date(latest) ? msg.created_at : latest, 
                user.messages[0].created_at
              )
            : null
        }))

        setUsers(processedUsers)
      } catch (err: any) {
        console.error("Error fetching users:", err)
        setUserError(err.message || "Failed to load users")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [user])

  // Add new useEffect to fetch requested items
  useEffect(() => {
    const fetchRequestedItems = async () => {
      if (!user || !isAdmin) return

      setIsLoadingRequestedItems(true)
      setRequestedItemsError(null)

      try {
        // First fetch all channels
        const { data: channelsData, error: channelsError } = await supabase
          .from("channels")
          .select("*")
          .order("name", { ascending: true })

        if (channelsError) {
          throw channelsError
        }

        // Then fetch all requested items - without trying to join profiles
        const { data: requestedItemsData, error: requestedItemsError } = await supabase
          .from("requested_items")
          .select("*")
          .order("created_at", { ascending: false })

        if (requestedItemsError) {
          throw requestedItemsError
        }

        // If we have requested items, fetch the associated profiles separately
        let profilesMap: Record<string, any> = {}
        
        if (requestedItemsData && requestedItemsData.length > 0) {
          // Get unique user IDs from all requested items
          const userIds = [...new Set(requestedItemsData.map(item => item.user_id))]
          
          // Fetch profiles for these users
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds)
            
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError)
          } else if (profilesData) {
            // Create a map of user_id -> profile for easy lookup
            profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {} as Record<string, any>)
          }
        }

        // Group requested items by channel
        const groupedItems: RequestedItemsByChannel[] = []

        // Initialize each channel with empty items array
        channelsData.forEach(channel => {
          groupedItems.push({
            channel: channel as Channel,
            items: []
          })
        })

        // Add items to their respective channels, with profile data attached
        requestedItemsData.forEach(item => {
          const channelGroup = groupedItems.find(group => group.channel.id === item.channel_id)
          if (channelGroup) {
            // Attach profile data to the item
            const itemWithProfile = {
              ...item,
              profiles: profilesMap[item.user_id] || null
            } as RequestedItem
            
            channelGroup.items.push(itemWithProfile)
          }
        })

        // Filter out channels with no requested items
        const filteredGroups = groupedItems.filter(group => group.items.length > 0)
        
        setRequestedItemsByChannel(filteredGroups)
      } catch (err: any) {
        console.error("Error fetching requested items:", err)
        setRequestedItemsError(err.message || "Failed to load requested items")
      } finally {
        setIsLoadingRequestedItems(false)
      }
    }

    fetchRequestedItems()
  }, [user, isAdmin])

  const toggleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: !isBlocked })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      // Update the local state to reflect the change
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, blocked: !isBlocked } : user
        )
      );
    } catch (err) {
      console.error("Error toggling block status:", err);
      setUserError("Failed to update user status");
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Function to update the status of a requested item
  const updateRequestedItemStatus = async (itemId: string, status: "approved" | "declined") => {
    try {
      const { error } = await supabase
        .from("requested_items")
        .update({ status })
        .eq("id", itemId)

      if (error) {
        throw error
      }

      // Update local state to reflect the change
      setRequestedItemsByChannel(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          items: group.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          )
        }))
      )
    } catch (err: any) {
      console.error("Error updating requested item status:", err)
      setRequestedItemsError(err.message || "Failed to update item status")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="create-alert" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger 
              value="create-alert" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Create Alert
            </TabsTrigger>
            <TabsTrigger 
              value="manage-users"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Manage Users
            </TabsTrigger>
            <TabsTrigger 
              value="active-alerts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Active Alerts
            </TabsTrigger>
            <TabsTrigger 
              value="requested-items"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Requested Items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create-alert">
            <Card>
              <CardHeader>
                <CardTitle>Create New Alert</CardTitle>
                <CardDescription>Create a new emergency alert and communication channel</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAlert} className="space-y-4" id="create-alert-form">
                  <div className="space-y-2">
                    <Label htmlFor="title">Alert Title</Label>
                    <Input
                      id="title"
                      placeholder="E.g., Hurricane Warning"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Alert Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide details about the emergency situation"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity Level</Label>
                    <Select value={severity} onValueChange={(value) => setSeverity(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channelName">Channel Name (Optional)</Label>
                    <Input
                      id="channelName"
                      placeholder="Leave blank to use alert title"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="channelDescription">Channel Description (Optional)</Label>
                    <Textarea
                      id="channelDescription"
                      placeholder="Leave blank to use alert description"
                      value={channelDescription}
                      onChange={(e) => setChannelDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preparationItems">Preparation Items</Label>
                    <div onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'BUTTON') {
                        e.preventDefault();
                      }
                    }}>
                      <AlertPreparationItems onItemsSelected={setPreparationItems} />
                    </div>
                  </div>

                  {error && (
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
                  )}

                  <Button type="submit" form="create-alert-form" className="w-full bg-red-200 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Start Alert"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-users">
            <div className="space-y-4">
              {isLoadingUsers ? (
                <div className="flex justify-center p-8">
                  <div className="animate-pulse">Loading users...</div>
                </div>
              ) : userError ? (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{userError}</h3>
                    </div>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <div className="grid gap-4">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={`${user.full_name || user.username}'s avatar`}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-lg">
                                {(user.full_name || user.username || '?')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <CardTitle>{user.full_name || user.username}</CardTitle>
                            <CardDescription>
                              {user.blocked ?? false ? (
                                <span className="text-red-500">Blocked</span>
                              ) : (
                                <span className="text-green-500">Active</span>
                              )}
                              {user.last_message_time && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  Last active: {new Date(user.last_message_time).toLocaleString()}
                                </div>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.phone_number && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `tel:${user.phone_number}`}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `sms:${user.phone_number}`}
                              >
                                <Smartphone className="h-4 w-4 mr-2" />
                                Text
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleBlockUser(user.id, user.blocked ?? false)}
                          >
                            {user.blocked ?? false ? "Unblock User" : "Block User"}
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="active-alerts">
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
                  No active alerts found.
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
                        {channel.alerts && channel.alerts.length > 0 ? (
                          <div className="space-y-4">
                            {channel.alerts.map((alert) => (
                              <div key={alert.id}>
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-1 rounded text-sm ${
                                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {alert.severity}
                                  </span>
                                </div>
                                <div className="mt-4">
                                  <Link href={`/channels/${channel.id}`}>
                                    <Button variant="outline" size="sm">
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      View Channel
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No alerts in this channel.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requested-items">
            <div className="space-y-4">
              {isLoadingRequestedItems ? (
                <div className="flex justify-center p-8">
                  <div className="animate-pulse">Loading requested items...</div>
                </div>
              ) : requestedItemsError ? (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{requestedItemsError}</h3>
                    </div>
                  </div>
                </div>
              ) : requestedItemsByChannel.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No requested items found.
                </div>
              ) : (
                <div className="space-y-6">
                  {requestedItemsByChannel.map((group) => (
                    <Card key={group.channel.id}>
                      <CardHeader>
                        <CardTitle>
                          <Link href={`/channels/${group.channel.id}`} className="hover:underline">
                            {group.channel.name}
                          </Link>
                        </CardTitle>
                        <CardDescription>{group.channel.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-sm">
                                  <th className="text-left p-3 border-b">Item</th>
                                  <th className="text-left p-3 border-b">Requested By</th>
                                  <th className="text-left p-3 border-b">Date</th>
                                  <th className="text-left p-3 border-b">Status</th>
                                  <th className="text-right p-3 border-b">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.items.map((item) => (
                                  <tr key={item.id} className="border-b border-gray-200">
                                    <td className="p-3">
                                      <div className="font-medium">{item.title}</div>
                                      {item.description && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {item.description}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        {item.profiles?.avatar_url ? (
                                          <img 
                                            src={item.profiles.avatar_url} 
                                            alt=""
                                            className="h-6 w-6 rounded-full"
                                          />
                                        ) : (
                                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-xs text-gray-500">
                                              {(item.profiles?.full_name || '?')[0].toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                        <span>{item.profiles?.full_name || "Unknown User"}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm">
                                      {formatDate(item.created_at)}
                                    </td>
                                    <td className="p-3">
                                      <span 
                                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                          item.status === 'approved' 
                                            ? 'bg-green-100 text-green-800' 
                                            : item.status === 'declined' 
                                              ? 'bg-red-100 text-red-800' 
                                              : 'bg-blue-100 text-blue-800'
                                        }`}
                                      >
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      {item.status === 'requested' && (
                                        <div className="flex items-center justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                            onClick={() => updateRequestedItemStatus(item.id, 'approved')}
                                          >
                                            Approve
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                            onClick={() => updateRequestedItemStatus(item.id, 'declined')}
                                          >
                                            Decline
                                          </Button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


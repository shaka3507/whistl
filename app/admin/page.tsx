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
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertPreparationItems } from "@/components/ui/alert-preparation-items"
// import { AlertPreparationItemsList } from "@/components/ui/alert-preparation-items-list"

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  console.log('Admin access check:', { userId: user?.id, isAdmin })
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="create-alert">
          <TabsList className="mb-4">
            <TabsTrigger value="create-alert">Create Alert</TabsTrigger>
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
            <TabsTrigger value="active-alerts">Active Alerts</TabsTrigger>
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

                  <Button type="submit" form="create-alert-form" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Alert & Channel"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-users">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>View and manage user permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  User management functionality will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active-alerts">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>View and manage active emergency alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Active alerts management will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase-types"
import { AlertTriangle, MessageSquare, Plus } from "lucide-react"

type Channel = Database["public"]["Tables"]["channels"]["Row"] & {
  alerts: Database["public"]["Tables"]["alerts"]["Row"][] | null
}

export default function ChannelsPage() {
  const { user, isAdmin } = useAuth()
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChannels = async () => {
      if (!user) return

      try {
        // Get channels the user is a member of
        const { data: memberChannels, error: memberError } = await supabase
          .from("channel_members")
          .select("channel_id")
          .eq("user_id", user.id)

        if (memberError) {
          throw memberError
        }

        if (!memberChannels.length) {
          setChannels([])
          setIsLoading(false)
          return
        }

        const channelIds = memberChannels.map((c) => c.channel_id)

        // Get channel details with related alerts
        const { data, error } = await supabase
          .from("channels")
          .select(`
            *,
            alerts(*)
          `)
          .in("id", channelIds)
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Ongoing events</h1>
          {(isAdmin && channels.length === 0) && (
            <Link href="/admin">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse">Loading channels...</div>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-muted p-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No channels yet</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                You haven't been added to any communication channels yet.
              </p>
              {isAdmin && (
                <Link href="/admin" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Alert & Channel
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => {
              const hasActiveAlert = channel.alerts?.some((alert) => alert.is_active)

              return (
                <Link key={channel.id} href={`/channels/${channel.id}`}>
                  <Card className="h-full overflow-hidden transition-all hover:shadow-md rounded-none">
                    {hasActiveAlert && (
                      <div className="bg-red-600 py-1 px-4 text-white text-xsfont-medium">Active Alert</div>
                    )}
                    <CardHeader>
                      <CardTitle>{channel.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{channel.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Created {new Date(channel.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}


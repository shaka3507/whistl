"use client"

import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DebugPage() {
  const { user, profile, session, isAdmin, isLoading } = useAuth()
  const [supabaseResponse, setSupabaseResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchProfileDirectly = async () => {
    if (!user) {
      setError("No user is logged in")
      return
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        setError(error.message)
        console.error("Direct profile fetch error:", error)
      } else {
        setSupabaseResponse(data)
        console.log("Direct profile fetch result:", data)
      }
    } catch (err: any) {
      setError(err.message)
      console.error("Error in direct fetch:", err)
    }
  }

  const makeAdmin = async () => {
    if (!user) {
      setError("No user is logged in")
      return
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        console.error("Make admin error:", error)
      } else {
        setSupabaseResponse(data)
        console.log("User set as admin:", data)
        // Force reload the page to update auth context
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message)
      console.error("Error in make admin:", err)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <h1 className="text-3xl font-bold mb-6">Debug Authentication</h1>
        
        <div className="grid gap-6">
          <section className="p-6 bg-card rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <pre className="bg-muted p-4 rounded overflow-auto max-h-[300px]">
              {JSON.stringify({ isLoading, isAuthenticated: !!user, isAdmin }, null, 2)}
            </pre>
          </section>

          <section className="p-6 bg-card rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">User Object</h2>
            {user ? (
              <pre className="bg-muted p-4 rounded overflow-auto max-h-[300px]">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No user logged in</p>
            )}
          </section>

          <section className="p-6 bg-card rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Profile Object</h2>
            {profile ? (
              <pre className="bg-muted p-4 rounded overflow-auto max-h-[300px]">
                {JSON.stringify(profile, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No profile loaded</p>
            )}
          </section>

          <section className="p-6 bg-card rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Direct Supabase Checks</h2>
            <div className="flex gap-4 mb-4">
              <Button onClick={fetchProfileDirectly}>Fetch Profile Directly</Button>
              <Button onClick={makeAdmin} variant="destructive">Make Admin</Button>
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded mb-4">
                {error}
              </div>
            )}
            
            {supabaseResponse && (
              <pre className="bg-muted p-4 rounded overflow-auto max-h-[300px]">
                {JSON.stringify(supabaseResponse, null, 2)}
              </pre>
            )}
          </section>
        </div>
      </main>
    </div>
  )
} 
"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, ArrowRight, MessageSquare, Shield, Clock, AlertCircle, BookOpen } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const { user, isAdmin } = useAuth()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full min-h-[80vh] flex items-center justify-center py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-4xl">
                  whistl response
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  for keeping us safe and connected through the storm.
                </p>
              </div>
              <div className="space-x-4">
                {(user && isAdmin) ? (
                  <>
                    <Link href="/admin">
                      <Button size="lg" className="bg-primary">
                        Create Alert
                        <AlertCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/prepare">
                      <Button variant="outline" size="lg">
                        Prepare
                        <BookOpen className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="bg-primary">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        Log In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        {!user &&
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Immediate Alerts</h3>
                <p className="text-muted-foreground">
                  Send critical notifications to all team members instantly.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Secure Communication</h3>
                <p className="text-muted-foreground">
                  End-to-end encrypted channels for sensitive information exchange.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Real-time Updates</h3>
                <p className="text-muted-foreground">
                  Stay informed with live situation updates and status changes.
                </p>
              </div>
            </div>
          </div>
        </section>
        }
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 whistl response. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}


"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full min-h-[80vh] flex items-center justify-center py-4 md:py-16 lg:py-8 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-4xl">
                  whistl
                </h1>
                an emergency response platform
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  sound the alarm, secure your team.
                </p>
              </div>
              <div className="space-x-4">
                {user ? (
                  <>
                    {isAdmin ? (
                      <Link href="/admin">
                        <Button size="lg" className="bg-primary">
                          Alert
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/channels">
                        <Button size="lg" className="bg-primary">
                          Get help
                        </Button>
                      </Link>
                    )}
                    <Link href="/prepare">
                      <Button variant="outline" size="lg">
                        Prepare
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
        {!user && (
          <section className="w-full">
            <div className="container px-4 md:px-6">
              <div className="mx-auto grid max-w-5xl items-center gap-4 py-8 lg:grid-cols-3">
                {[
                  {
                    icon: AlertTriangle,
                    title: "alert",
                    description:
                      "Stay informed with live situation updates and status changes.",
                  },
                  {
                    icon: MessageSquare,
                    title: "gather and disperse",
                    description:
                      "Ensure your community has the supplies and information they need.",
                  },
                  {
                    icon: Clock,
                    title: "prepare",
                    description:
                      "Stay informed and prepared for any situation.",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="card flex flex-col justify-center space-y-4 text-center p-6 shadow-lg rounded-lg bg-white/10 text-white"
                  >
                    <div className="flex items-center justify-center h-12 w-full">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="border-t py-3 md:py-2">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 whistl response. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Bell, Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
} from "@/components/ui/sheet";

export function Header() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "U";

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b relative z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span>whistl</span>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-sm font-medium">
            Home
          </Link>
          {user && (
            <Link href="/prepare" className="text-sm font-medium">
              Prepare
            </Link>
          )}
          {user && (
            <Link href="/channels" className="text-sm font-medium">
              Current Alerts
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>No new notifications</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.avatar_url || ""}
                        alt={profile?.full_name || "User"}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" className="hidden md:block">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="top"
              className="pt-12 pb-6 px-6 w-full border-b border-border shadow-lg data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top [&>button]:hidden flex flex-col items-center"
            >
              <SheetHeader className="mb-8 flex items-center justify-between w-full">
                <Link
                  href="/"
                  className="text-xl font-bold"
                  onClick={closeMenu}
                >
                  whistl
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    close menu
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </SheetHeader>

              <nav className="flex flex-col items-center text-center space-y-7 w-full max-w-xs">
                <Link
                  href="/"
                  className="text-lg font-medium hover:text-primary/80 transition-colors w-full"
                  onClick={closeMenu}
                >
                  Home
                </Link>
                {user && (
                  <>
                    <Link
                      href="/channels"
                      className="text-lg font-medium hover:text-primary/80 transition-colors w-full"
                      onClick={closeMenu}
                    >
                      Current Alerts
                    </Link>
                    <Link
                      href="/prepare"
                      className="text-lg font-medium hover:text-primary/80 transition-colors w-full"
                      onClick={closeMenu}
                    >
                      Prepare
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-lg font-medium hover:text-primary/80 transition-colors w-full"
                    onClick={closeMenu}
                  >
                    Admin
                  </Link>
                )}

                {user ? (
                  <div className="pt-6 border-t w-full flex flex-col items-center">
                    <Button
                      variant="outline"
                      className="w-full mt-5 max-w-xs"
                      onClick={() => {
                        signOut();
                        closeMenu();
                      }}
                    >
                      Log out
                    </Button>
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="w-full max-w-xs"
                    >
                      <Button variant="ghost" className="w-full mt-3">
                        Profile
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3 pt-6 border-t w-full items-center">
                    <Link href="/login" onClick={closeMenu} className="w-full">
                      <Button variant="outline" className="w-full mt-5">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={closeMenu} className="w-full">
                      <Button className="w-full mt-2">Sign up</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

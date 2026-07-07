"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookmarkIcon,
  LogOutIcon,
  ShieldIcon,
  TrainFront,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

import AuthModal from "@/components/auth/AuthModal";
import MobileNav from "@/components/layout/MobileNav";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  avatarColor,
  avatarUrl,
  displayName,
  initials,
} from "@/lib/user";

export default function AppHeader() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAdmin = useIsAdmin();

  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="group flex items-center gap-3"
            >
              <div
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-red-500
                  via-red-600
                  to-red-700
                  shadow-lg
                  shadow-red-500/20
                  transition-all
                  duration-300
                  group-hover:scale-110
                  group-hover:rotate-6
                "
              >
                <TrainFront className="h-5 w-5 text-white" />
              </div>

              <div className="leading-tight">
                <h1 className="text-lg font-bold tracking-tight">
                  TrackHopper
                </h1>

                <p className="text-xs text-muted-foreground">
                  Smart London Journey Planner
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
            

              {user && (
                <Link
                  href="/saved-routes"
                  className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Saved Routes
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden sm:flex items-center gap-3">
                  {user ? (
                    <>
                      <Button
                        
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Link
                          href="/saved-routes"
                          aria-label="Saved Routes"
                        >
                          <BookmarkIcon className="h-5 w-5" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              className="
                                h-11
                                rounded-full
                                pl-1
                                pr-3
                                transition-all
                                hover:bg-accent
                              "
                            />
                          }
                        >
                          <Avatar size="sm">
                            {avatarUrl(user) && (
                              <AvatarImage
                                src={avatarUrl(user)!}
                                alt={displayName(user)}
                              />
                            )}

                            <AvatarFallback
                              className={avatarColor(
                                user.email ?? user.id ?? ""
                              )}
                            >
                              <span className="text-xs text-white">
                                {initials(user)}
                              </span>
                            </AvatarFallback>
                          </Avatar>

                          <span className="max-w-[140px] truncate text-sm font-medium">
                            {displayName(user)}
                          </span>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-60 rounded-xl"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                              {user.email}
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            render={<Link href="/saved-routes" />}
                          >
                            <BookmarkIcon className="mr-2 h-4 w-4" />
                            Saved Routes
                          </DropdownMenuItem>

                          {isAdmin && (
                            <DropdownMenuItem
                              render={<Link href="/admin" />}
                            >
                              <ShieldIcon className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            variant="destructive"
                            onClick={signOut}
                          >
                            <LogOutIcon className="mr-2 h-4 w-4" />
                            Sign Out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <Button
                      onClick={() => setShowAuth(true)}
                      className="
                        rounded-full
                        px-5
                        font-medium
                        bg-red-600
                        text-white
                        shadow-lg
                        shadow-red-500/20
                        transition-all
                        duration-300
                        hover:bg-red-700
                        hover:scale-105
                      "
                    >
                      Sign In
                    </Button>
                  )}
                </div>

                {/* Mobile */}
                <div className="sm:hidden">
                  <MobileNav
                    user={user}
                    isAdmin={isAdmin}
                    onSignOut={signOut}
                    onSignInClick={() => setShowAuth(true)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
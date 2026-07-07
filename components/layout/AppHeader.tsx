"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkIcon, LogOutIcon, ShieldIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import AuthModal from "@/components/auth/AuthModal";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { avatarColor, avatarUrl, displayName, initials } from "@/lib/user";

export default function AppHeader() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          {/* Brand */}
          <Link
            href="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            {/* Logo mark — a stylised track/rail roundel */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-[2.5px] border-red-600" />
              {/* Crossbar */}
              <div className="absolute inset-x-0 top-1/2 h-[18px] -translate-y-1/2 bg-red-600" />
              <span className="relative z-10 text-[11px] font-extrabold tracking-tight text-white">
                TH
              </span>
            </div>

            <div className="min-w-0 leading-none">
              <p className="truncate text-[17px] font-semibold tracking-[-0.02em]">
                TrackHopper
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                London journey planner
              </p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden sm:flex sm:items-center sm:gap-1.5">
                  {user ? (
                    <>
                      {/* Quick-access saved routes */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Link href="/saved-routes" aria-label="Saved routes">
                          <BookmarkIcon className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              className="h-8 gap-2 rounded-full pl-1 pr-2.5 hover:bg-accent"
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
                                user.email ?? user.id ?? "",
                              )}
                            >
                              <span className="text-white text-xs">
                                {initials(user)}
                              </span>
                            </AvatarFallback>
                          </Avatar>
                          <span className="max-w-[100px] truncate text-sm font-medium">
                            {displayName(user)}
                          </span>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                              {user.email}
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            render={<Link href="/saved-routes" />}
                          >
                            <BookmarkIcon />
                            Saved routes
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem render={<Link href="/admin" />}>
                              <ShieldIcon />
                              Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => signOut()}
                          >
                            <LogOutIcon />
                            Sign out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="cursor-pointer h-8    rounded-full bg-red-600 px-4 text-xs  text-white shadow-none   
                      hover:bg-red-700
                      "
                      onClick={() => setShowAuth(true)}
                    >
                      Sign in
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


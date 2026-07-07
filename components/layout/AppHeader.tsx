"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkIcon, LogOutIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600">
              <span className="text-xs font-bold text-white">TH</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold leading-none">TrackHopper</p>
              <p className="mt-0.5 text-xs text-muted-foreground">London journey planner</p>
            </div>
          </Link>

          <div className="shrink-0">
            {authLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : (
              <>
                {/* Desktop: avatar dropdown */}
                <div className="hidden sm:block">
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-1.5" />}>
                        <Avatar size="sm">
                          {avatarUrl(user) && <AvatarImage src={avatarUrl(user)!} alt={displayName(user)} />}
                          <AvatarFallback className={avatarColor(user.email ?? user.id ?? "")}>
                            <span className="text-white">{initials(user)}</span>
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[120px] truncate text-sm font-medium">
                          {displayName(user)}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                            {user.email}
                          </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem render={<Link href="/saved-routes" />}>
                          <BookmarkIcon />
                          Saved routes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                          <LogOutIcon />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
                      Sign in
                    </Button>
                  )}
                </div>

                {/* Mobile: sheet nav */}
                <div className="sm:hidden">
                  <MobileNav user={user} onSignOut={signOut} onSignInClick={() => setShowAuth(true)} />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onSuccess={() => setShowAuth(false)} onClose={() => setShowAuth(false)} />}
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, LogOutIcon, ShieldIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import AuthModal from "@/components/auth/AuthModal";
import BrandMark from "@/components/layout/BrandMark";
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
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);

  const navLink = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary/8 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/78">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
              aria-label="TrackHopper home"
            >
              <BrandMark className="size-9 transition-transform duration-200 group-hover:-rotate-2 group-hover:scale-[1.03]" />
              <div className="min-w-0 leading-none">
                <p className="truncate text-[17px] font-bold tracking-[-0.035em] sm:text-lg">
                  TrackHopper
                </p>
                <p className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
                  London, in motion
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
              <Link href="/" className={navLink(pathname === "/")}>
                Plan a journey
              </Link>
              {user && (
                <Link
                  href="/saved-routes"
                  className={navLink(pathname === "/saved-routes")}
                >
                  Saved routes
                </Link>
              )}
              {user && isAdmin && (
                <Link href="/admin" className={navLink(pathname.startsWith("/admin"))}>
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="size-10 animate-pulse rounded-full bg-muted" aria-label="Loading account" />
            ) : (
              <>
                <div className="hidden items-center sm:flex">
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            className="h-10 gap-2.5 rounded-full py-1 pr-3 pl-1.5"
                          />
                        }
                      >
                        <Avatar>
                          {avatarUrl(user) && (
                            <AvatarImage src={avatarUrl(user)!} alt={displayName(user)} />
                          )}
                          <AvatarFallback className={avatarColor(user.email ?? user.id ?? "")}>
                            <span className="text-xs text-white">{initials(user)}</span>
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-32 truncate text-sm font-semibold">
                          {displayName(user)}
                        </span>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="truncate px-2.5 py-2 font-normal">
                            Signed in as <span className="font-medium text-foreground">{user.email}</span>
                          </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem render={<Link href="/saved-routes" />}>
                          <BookmarkIcon />
                          Saved routes
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem render={<Link href="/admin" />}>
                            <ShieldIcon />
                            Admin dashboard
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                          <LogOutIcon />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button size="sm" className="rounded-full px-4" onClick={() => setShowAuth(true)}>
                      Sign in
                    </Button>
                  )}
                </div>

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

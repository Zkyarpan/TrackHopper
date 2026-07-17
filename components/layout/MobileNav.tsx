"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, BookmarkIcon, LogOutIcon, HomeIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import BrandMark from "@/components/layout/BrandMark";
import { avatarColor, avatarUrl, displayName, initials, type UserMeta } from "@/lib/user";
import { cn } from "@/lib/utils";

interface Props {
  user: UserMeta | null;
  isAdmin?: boolean;
  onSignOut: () => void;
  onSignInClick: () => void;
}

export default function MobileNav({ user, isAdmin, onSignOut, onSignInClick }: Props) {
  const [open, setOpen] = useState(false);
  const pendingSignInRef = useRef(false);
  const pathname = usePathname();

  const navClass = (active: boolean) =>
    cn(
      "flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent",
    );

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen && pendingSignInRef.current) {
          pendingSignInRef.current = false;
          onSignInClick();
        }
      }}
    >
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Open menu" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="border-b border-border/70">
          <div className="flex items-center gap-3">
            <BrandMark className="size-9" />
            <div>
              <SheetTitle>TrackHopper</SheetTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">London, in motion</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col px-3 pt-3">
          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/60 p-3.5">
              <Avatar size="lg">
                {avatarUrl(user) && <AvatarImage src={avatarUrl(user)!} alt={displayName(user)} />}
                <AvatarFallback className={avatarColor(user.email ?? user.id ?? "")}>
                  <span className="text-white">{initials(user)}</span>
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName(user)}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <nav className="space-y-1" aria-label="Mobile navigation">
            <SheetClose
              render={<Link href="/" onClick={() => setOpen(false)} />}
              nativeButton={false}
              className={navClass(pathname === "/")}
            >
              <HomeIcon className="size-4.5" />
              Plan a journey
            </SheetClose>

            {user && (
              <SheetClose
                render={<Link href="/saved-routes" onClick={() => setOpen(false)} />}
                nativeButton={false}
                className={navClass(pathname === "/saved-routes")}
              >
                <BookmarkIcon className="size-4.5" />
                Saved routes
              </SheetClose>
            )}

            {user && isAdmin && (
              <SheetClose
                render={<Link href="/admin" onClick={() => setOpen(false)} />}
                nativeButton={false}
                className={navClass(pathname.startsWith("/admin"))}
              >
                <ShieldIcon className="size-4.5" />
                Admin dashboard
              </SheetClose>
            )}
          </nav>

          <div className="mt-auto border-t border-border/70 pt-4">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOutIcon className="size-4.5" />
                Sign out
              </button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  pendingSignInRef.current = true;
                  setOpen(false);
                }}
              >
                Sign in to TrackHopper
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

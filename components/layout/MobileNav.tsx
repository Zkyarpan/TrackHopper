"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MenuIcon, BookmarkIcon, LogOutIcon, HomeIcon, ShieldIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { avatarColor, avatarUrl, displayName, initials, type UserMeta } from "@/lib/user";

interface Props {
  user: UserMeta | null;
  isAdmin?: boolean;
  onSignOut: () => void;
  onSignInClick: () => void;
}

export default function MobileNav({ user, isAdmin, onSignOut, onSignInClick }: Props) {
  const [open, setOpen] = useState(false);
  const pendingSignInRef = useRef(false);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        // Wait for the sheet's close animation to finish before opening the
        // auth dialog — opening both overlays at once stacks them wrong.
        if (!isOpen && pendingSignInRef.current) {
          pendingSignInRef.current = false;
          onSignInClick();
        }
      }}
    >
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4">
          {user && (
            <div className="mb-2 flex items-center gap-2.5 border-b pb-3">
              <Avatar>
                {avatarUrl(user) && <AvatarImage src={avatarUrl(user)!} alt={displayName(user)} />}
                <AvatarFallback className={avatarColor(user.email ?? user.id ?? "")}>
                  <span className="text-white">{initials(user)}</span>
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName(user)}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <SheetClose
            render={<Link href="/" onClick={() => setOpen(false)} />}
            nativeButton={false}
            className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-muted"
          >
            <HomeIcon className="h-4 w-4 text-muted-foreground" />
            Plan a journey
          </SheetClose>

          {user && (
            <SheetClose
              render={<Link href="/saved-routes" onClick={() => setOpen(false)} />}
              nativeButton={false}
              className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-muted"
            >
              <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
              Saved routes
            </SheetClose>
          )}

          {user && isAdmin && (
            <SheetClose
              render={<Link href="/admin" onClick={() => setOpen(false)} />}
              nativeButton={false}
              className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm hover:bg-muted"
            >
              <ShieldIcon className="h-4 w-4 text-muted-foreground" />
              Admin
            </SheetClose>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <Button className="mt-2" onClick={() => { pendingSignInRef.current = true; setOpen(false); }}>
              Sign in
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

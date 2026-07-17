"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  Loader2Icon,
  LockKeyholeIcon,
  MapIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import AuthModal from "@/components/auth/AuthModal";
import AppHeader from "@/components/layout/AppHeader";
import Footer from "@/components/layout/Footer";
import type { SavedRoute } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function SavedRoutesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { savedRoutes, isLoading, error, deleteRoute } = useSavedRoutes();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteRoute(id);
      toast.success("Route deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete route");
    } finally {
      setDeletingId(null);
    }
  }

  function rerunRoute(route: SavedRoute) {
    const params = new URLSearchParams({
      fromId: route.from_station_id,
      fromName: route.from_station_name,
      toId: route.to_station_id,
      toName: route.to_station_name,
    });
    router.push(`/?${params}`);
  }

  if (!authLoading && !user) {
    return (
      <div className="app-shell flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <Card className="surface-elevated w-full max-w-lg rounded-3xl border-white/80 bg-card/95">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
              <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <LockKeyholeIcon className="size-7" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Your routes, ready when you are</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Sign in to keep regular journeys in one place and plan them again in a tap.
              </p>
              <Button size="lg" className="mt-7 min-w-40" onClick={() => setShowAuth(true)}>
                Sign in to continue
              </Button>
              {showAuth && (
                <AuthModal
                  onSuccess={() => setShowAuth(false)}
                  onClose={() => setShowAuth(false)}
                />
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 border border-primary/10 bg-primary/8 text-primary">
              <BookmarkIcon /> Your shortcuts
            </Badge>
            <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Saved routes</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your regular journeys, ready to plan with current travel data.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/" />}>
            <ArrowLeftIcon />
            Back to journey planner
          </Button>
        </div>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-60 w-full rounded-3xl" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertDescription>
              <span className="font-semibold">Could not load saved routes. </span>{error}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && savedRoutes.length === 0 && (
          <Card className="rounded-3xl border-dashed bg-card/75">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
              <span className="flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                <MapIcon className="size-7" />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em]">No saved routes yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Plan a journey, then choose <strong className="font-semibold text-foreground">Save route</strong> to keep it here.
              </p>
              <Button size="lg" className="mt-6" render={<Link href="/" />}>
                <PlusIcon />
                Plan your first route
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && savedRoutes.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {savedRoutes.map((route) => (
              <Card key={route.id} className="group rounded-3xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_42px_color-mix(in_oklch,var(--primary)_8%,transparent)]">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <BookmarkIcon className="size-4.5 fill-current" />
                    </span>
                    <Badge variant="secondary">Saved journey</Badge>
                  </div>

                  <div className="mt-5 min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-[-0.025em]">
                      {route.nickname ?? `${route.from_station_name} to ${route.to_station_name}`}
                    </h2>
                    {route.nickname && <p className="mt-1 text-xs text-muted-foreground">Regular route</p>}
                  </div>

                  <div className="mt-5 rounded-2xl border border-border/70 bg-muted/45 p-4">
                    <div className="flex items-center gap-3">
                      <span className="size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/10" />
                      <p className="min-w-0 truncate text-sm font-semibold">{route.from_station_name}</p>
                    </div>
                    <span className="ml-[4px] block h-5 w-px bg-border" />
                    <div className="flex items-center gap-3">
                      <span className="size-2.5 shrink-0 rounded-full bg-brand ring-4 ring-brand/10" />
                      <p className="min-w-0 truncate text-sm font-semibold">{route.to_station_name}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <Button className="flex-1" onClick={() => rerunRoute(route)}>
                      <PlayIcon />
                      Plan again
                      <ArrowRightIcon className="ml-auto" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(route.id)}
                      disabled={deletingId === route.id}
                      aria-label={`Delete ${route.nickname ?? "saved route"}`}
                    >
                      {deletingId === route.id ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

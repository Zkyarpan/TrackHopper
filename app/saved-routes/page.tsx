"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftIcon, BookmarkIcon, MapIcon, PlayIcon, Trash2Icon } from "lucide-react";
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

export default function SavedRoutesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // isLoading from useSavedRoutes already folds in authLoading
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
    // Navigate to home with query params — the home page's useJourneySearch
    // picks these up to pre-populate and trigger the journey search.
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
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <p className="text-muted-foreground">Sign in to view your saved routes.</p>
          <Button onClick={() => setShowAuth(true)}>Sign in</Button>
          {showAuth && <AuthModal onSuccess={() => setShowAuth(false)} onClose={() => setShowAuth(false)} />}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Saved routes</h1>
          <Link href="/" className="flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Plan a journey
          </Link>
        </div>

        {/* State 1 — Loading (auth resolving or fetch in progress) */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* State 2 — Error (fetch failed — e.g. network / auth / RLS error) */}
        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertDescription>
              <span className="font-medium">Could not load saved routes.</span>{" "}
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* State 3 — Empty but successful (logged-in, fetch OK, zero routes) */}
        {!isLoading && !error && savedRoutes.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MapIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No saved routes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Plan a journey and tap <strong>Save route</strong> to keep it here.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <MapIcon className="h-4 w-4" />
                Plan a journey
              </Button>
            </Link>
          </div>
        )}

        {/* State 4 — Has routes */}
        {!isLoading && !error && savedRoutes.length > 0 && (
          <div className="space-y-3">
            {savedRoutes.map((route) => (
              <Card key={route.id}>
                <CardContent className="flex items-center gap-3">
                  <BookmarkIcon className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {route.nickname ?? `${route.from_station_name} → ${route.to_station_name}`}
                    </p>
                    {route.nickname && (
                      <p className="truncate text-xs text-muted-foreground">
                        {route.from_station_name} → {route.to_station_name}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => rerunRoute(route)}>
                      <PlayIcon />
                      Plan again
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(route.id)}
                      disabled={deletingId === route.id}
                    >
                      <Trash2Icon />
                      {deletingId === route.id ? "…" : "Delete"}
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

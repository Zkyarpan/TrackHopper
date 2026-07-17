import type { Metadata } from "next";
import { ShieldCheckIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/layout/AppHeader";
import Footer from "@/components/layout/Footer";
import AdminTabs from "@/components/admin/AdminTabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin dashboard — TrackHopper",
  description: "TrackHopper service and account administration.",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [profilesRes, routesRes, logsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, created_at, last_sign_in_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_routes")
      .select("id, user_id, from_station_name, to_station_name, nickname, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("api_logs")
      .select("id, api, success, error, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const profiles = profilesRes.data ?? [];
  const routes = routesRes.data ?? [];
  const logs = logsRes.data ?? [];

  const emailById = new Map(profiles.map((p) => [p.id, p.email]));
  const routeCountByUserId = new Map<string, number>();
  for (const r of routes) {
    routeCountByUserId.set(r.user_id, (routeCountByUserId.get(r.user_id) ?? 0) + 1);
  }

  const users = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    createdAt: p.created_at,
    lastSignInAt: p.last_sign_in_at,
    routeCount: routeCountByUserId.get(p.id) ?? 0,
  }));

  const allRoutes = routes.map((r) => ({
    id: r.id,
    userEmail: emailById.get(r.user_id) ?? "(unknown)",
    fromStationName: r.from_station_name,
    toStationName: r.to_station_name,
    nickname: r.nickname,
    createdAt: r.created_at,
  }));

  const apiLogs = logs.map((l) => ({
    id: l.id,
    api: l.api,
    success: l.success,
    error: l.error,
    createdAt: l.created_at,
  }));

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheckIcon className="size-3.5" />
            Protected workspace
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor accounts, saved journeys, and the health of connected travel services.
          </p>
        </div>
        <AdminTabs users={users} routes={allRoutes} logs={apiLogs} />
      </main>
      <Footer />
    </div>
  );
}

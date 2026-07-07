"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  routeCount: number;
}

interface RouteRow {
  id: string;
  userEmail: string;
  fromStationName: string;
  toStationName: string;
  nickname: string | null;
  createdAt: string;
}

interface LogRow {
  id: string;
  api: string;
  success: boolean;
  error: string | null;
  createdAt: string;
}

interface Props {
  users: UserRow[];
  routes: RouteRow[];
  logs: LogRow[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTabs({ users, routes, logs }: Props) {
  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
        <TabsTrigger value="routes">Saved routes ({routes.length})</TabsTrigger>
        <TabsTrigger value="logs">API logs ({logs.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-4">
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Signed up</th>
                <th className="px-3 py-2 font-medium">Last sign in</th>
                <th className="px-3 py-2 font-medium">Saved routes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {u.lastSignInAt ? formatDate(u.lastSignInAt) : "—"}
                  </td>
                  <td className="px-3 py-2">{u.routeCount}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="routes" className="mt-4">
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">From</th>
                <th className="px-3 py-2 font-medium">To</th>
                <th className="px-3 py-2 font-medium">Nickname</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{r.userEmail}</td>
                  <td className="px-3 py-2">{r.fromStationName}</td>
                  <td className="px-3 py-2">{r.toStationName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.nickname ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    No saved routes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="logs" className="mt-4">
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">API</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Error</th>
                <th className="px-3 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr
                  key={l.id}
                  className={`border-b last:border-0 ${l.success ? "" : "bg-destructive/5"}`}
                >
                  <td className="px-3 py-2 capitalize">{l.api}</td>
                  <td className="px-3 py-2">
                    {l.success ? (
                      <Badge variant="outline">Success</Badge>
                    ) : (
                      <Badge variant="destructive">Failure</Badge>
                    )}
                  </td>
                  <td className={`px-3 py-2 ${l.success ? "text-muted-foreground" : "text-destructive"}`}>
                    {l.error ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No API calls logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

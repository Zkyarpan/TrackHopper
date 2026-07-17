"use client";

import {
  ActivityIcon,
  BookmarkIcon,
  CircleCheckIcon,
  CircleXIcon,
  UsersIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card size="sm" className="rounded-2xl bg-card/90">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.04em] tabular-nums">{value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_28px_color-mix(in_oklch,var(--foreground)_4%,transparent)]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const headCell = "whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-muted-foreground";
const cell = "px-4 py-3.5 align-middle";

export default function AdminTabs({ users, routes, logs }: Props) {
  const successfulLogs = logs.filter((log) => log.success).length;
  const failedLogs = logs.length - successfulLogs;
  const successRate = logs.length > 0 ? Math.round((successfulLogs / logs.length) * 100) : 100;

  return (
    <div>
      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<UsersIcon className="size-4.5" />} label="Total users" value={users.length} detail="Registered accounts" />
        <StatCard icon={<BookmarkIcon className="size-4.5" />} label="Saved routes" value={routes.length} detail="Across all accounts" />
        <StatCard icon={<CircleCheckIcon className="size-4.5" />} label="API success" value={`${successRate}%`} detail="Latest 100 requests" />
        <StatCard icon={<CircleXIcon className="size-4.5" />} label="Failed calls" value={failedLogs} detail="In the current log view" />
      </div>

      <Tabs defaultValue="users">
        <div className="mb-4 overflow-x-auto pb-1">
          <TabsList className="w-max min-w-full justify-start sm:min-w-0">
            <TabsTrigger value="users">
              <UsersIcon /> Users <span className="text-muted-foreground">{users.length}</span>
            </TabsTrigger>
            <TabsTrigger value="routes">
              <BookmarkIcon /> Saved routes <span className="text-muted-foreground">{routes.length}</span>
            </TabsTrigger>
            <TabsTrigger value="logs">
              <ActivityIcon /> API logs <span className="text-muted-foreground">{logs.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users">
          <TableShell>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/55">
                <tr>
                  <th className={headCell}>Email</th>
                  <th className={headCell}>Signed up</th>
                  <th className={headCell}>Last sign in</th>
                  <th className={headCell}>Saved routes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/35">
                    <td className={`${cell} max-w-64 truncate font-medium`}>{u.email ?? "—"}</td>
                    <td className={`${cell} whitespace-nowrap text-muted-foreground tabular-nums`}>{formatDate(u.createdAt)}</td>
                    <td className={`${cell} whitespace-nowrap text-muted-foreground tabular-nums`}>
                      {u.lastSignInAt ? formatDate(u.lastSignInAt) : "—"}
                    </td>
                    <td className={`${cell} tabular-nums`}><Badge variant="secondary">{u.routeCount}</Badge></td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-14 text-center text-muted-foreground">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </TabsContent>

        <TabsContent value="routes">
          <TableShell>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/55">
                <tr>
                  <th className={headCell}>User</th>
                  <th className={headCell}>From</th>
                  <th className={headCell}>To</th>
                  <th className={headCell}>Nickname</th>
                  <th className={headCell}>Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {routes.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/35">
                    <td className={`${cell} max-w-56 truncate font-medium`}>{r.userEmail}</td>
                    <td className={`${cell} max-w-48 truncate`}>{r.fromStationName}</td>
                    <td className={`${cell} max-w-48 truncate`}>{r.toStationName}</td>
                    <td className={`${cell} text-muted-foreground`}>{r.nickname ?? "—"}</td>
                    <td className={`${cell} whitespace-nowrap text-muted-foreground tabular-nums`}>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-14 text-center text-muted-foreground">No saved routes yet.</td></tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </TabsContent>

        <TabsContent value="logs">
          <TableShell>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/55">
                <tr>
                  <th className={headCell}>API</th>
                  <th className={headCell}>Status</th>
                  <th className={headCell}>Error</th>
                  <th className={headCell}>Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {logs.map((l) => (
                  <tr key={l.id} className={`transition-colors hover:bg-muted/35 ${l.success ? "" : "bg-destructive/[0.035]"}`}>
                    <td className={`${cell} font-mono text-xs font-semibold uppercase tracking-[0.04em]`}>{l.api}</td>
                    <td className={cell}>
                      {l.success ? <Badge variant="success">Success</Badge> : <Badge variant="destructive">Failure</Badge>}
                    </td>
                    <td className={`${cell} max-w-md ${l.success ? "text-muted-foreground" : "font-medium text-destructive"}`}>
                      <span className="line-clamp-2">{l.error ?? "—"}</span>
                    </td>
                    <td className={`${cell} whitespace-nowrap text-muted-foreground tabular-nums`}>{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-14 text-center text-muted-foreground">No API calls logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </TableShell>
        </TabsContent>
      </Tabs>
    </div>
  );
}

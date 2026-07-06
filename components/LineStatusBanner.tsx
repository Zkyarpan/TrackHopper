"use client";

import { useEffect, useState } from "react";
import type { LineStatus } from "@/lib/types";

const DISRUPTED = new Set([
  "minor delays",
  "severe delays",
  "part suspended",
  "suspended",
  "part closure",
  "closed",
  "bus service",
  "special service",
  "reduced service",
  "not running",
]);

function severityClass(status: string) {
  const s = status.toLowerCase();
  if (s === "good service" || s === "no issues") return "good";
  if (s === "minor delays") return "amber";
  return "red";
}

export default function LineStatusBanner() {
  const [lines, setLines] = useState<LineStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/line-status")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setLines(d.lines ?? []);
      })
      .catch(() => setError("Could not load line status"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 animate-pulse">
        Loading line status…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
        Line status unavailable
      </div>
    );
  }

  const disrupted = lines.filter((l) =>
    DISRUPTED.has(l.status.toLowerCase())
  );
  const allGood = disrupted.length === 0;

  if (allGood) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 font-medium">
        Good service on all lines
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Service alerts
      </p>
      {disrupted.map((line) => {
        const sev = severityClass(line.status);
        const badgeClass =
          sev === "red"
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700";
        return (
          <div
            key={line.id}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="font-medium text-gray-800">{line.name}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {line.status}
            </span>
            {line.reason && (
              <span className="text-xs text-gray-500 line-clamp-1">
                {line.reason.replace(/^[^:]+:\s*/, "")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

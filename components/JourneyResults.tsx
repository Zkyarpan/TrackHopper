"use client";

import type { Journey } from "@/lib/types";

const MODE_LABELS: Record<string, string> = {
  tube: "Tube",
  bus: "Bus",
  walking: "Walk",
  walk: "Walk",
  "elizabeth-line": "Elizabeth",
  overground: "Overground",
  dlr: "DLR",
  tram: "Tram",
  "national-rail": "Rail",
  cycle: "Cycle",
  "cycle-hire": "Cycle",
};

const MODE_COLOURS: Record<string, string> = {
  tube: "bg-red-600 text-white",
  bus: "bg-red-500 text-white",
  walking: "bg-green-600 text-white",
  walk: "bg-green-600 text-white",
  "elizabeth-line": "bg-purple-700 text-white",
  overground: "bg-orange-500 text-white",
  dlr: "bg-teal-600 text-white",
  tram: "bg-green-500 text-white",
  "national-rail": "bg-gray-700 text-white",
};

function modeBadge(mode: string) {
  const label = MODE_LABELS[mode] ?? mode;
  const colour = MODE_COLOURS[mode] ?? "bg-gray-500 text-white";
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${colour}`}
    >
      {label}
    </span>
  );
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatFare(fare: number | null) {
  if (fare === null) return null;
  return `£${fare.toFixed(2)}`;
}

interface Props {
  journeys: Journey[];
}

export default function JourneyResults({ journeys }: Props) {
  if (journeys.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {journeys.length === 1 ? "1 route found" : `${journeys.length} routes found`}
      </h2>

      {journeys.map((journey, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          {/* Journey summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {formatTime(journey.departureTime) && (
                <span>
                  <span className="font-medium text-gray-900">
                    {formatTime(journey.departureTime)}
                  </span>
                  {" → "}
                  <span className="font-medium text-gray-900">
                    {formatTime(journey.arrivalTime)}
                  </span>
                </span>
              )}
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 font-medium">
                {journey.duration} min
              </span>
              {formatFare(journey.fare) && (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-green-700 font-medium">
                  {formatFare(journey.fare)}
                </span>
              )}
            </div>
            {idx === 0 && (
              <span className="text-xs text-gray-400 font-medium">
                Fastest
              </span>
            )}
          </div>

          {/* Legs */}
          <ol className="space-y-2">
            {journey.legs.map((leg, li) => (
              <li key={li} className="flex items-start gap-3 text-sm">
                <div className="pt-0.5 shrink-0">{modeBadge(leg.mode)}</div>
                <div className="min-w-0">
                  <div className="text-gray-800">
                    {leg.from && leg.to ? (
                      <>
                        <span className="font-medium">{leg.from}</span>
                        {" → "}
                        <span className="font-medium">{leg.to}</span>
                      </>
                    ) : (
                      leg.instruction
                    )}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5 flex flex-wrap gap-2">
                    {leg.lineName && leg.lineName !== leg.mode && (
                      <span>{leg.lineName}</span>
                    )}
                    <span>{leg.duration} min</span>
                    {leg.departureTime && (
                      <span>
                        {formatTime(leg.departureTime)} – {formatTime(leg.arrivalTime)}
                      </span>
                    )}
                  </div>
                  {leg.instruction &&
                    leg.from &&
                    leg.instruction !== `${leg.from} to ${leg.to}` && (
                      <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">
                        {leg.instruction}
                      </p>
                    )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

"use client";

// JourneyMap renders a Leaflet map showing the route polyline and markers.
// Leaflet requires window/document — this component is always imported with
// dynamic(..., { ssr: false }) so it never runs on the server.
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, Circle } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { JourneyLeg } from "@/lib/types";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default marker icon broken by webpack asset hashing
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Mode colours matching TfL branding
const MODE_COLOURS: Record<string, string> = {
  tube: "#dc2626",        // red
  bus: "#e53e3e",         // red bus
  walking: "#16a34a",     // green
  walk: "#16a34a",
  "elizabeth-line": "#7c3aed", // purple
  overground: "#f97316",  // orange
  dlr: "#0d9488",         // teal
  tram: "#22c55e",        // green
  "national-rail": "#1e40af", // dark blue
  cycle: "#ca8a04",       // yellow
};

const MODE_WEIGHT: Record<string, number> = {
  walking: 2,
  walk: 2,
};

// Component that adjusts map bounds to fit all route points
function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      const bounds = L.latLngBounds(points);
      // Validate bounds are within London region before fitting
      const centre = bounds.getCenter();
      if (
        centre.lat < 51.2 || centre.lat > 51.8 ||
        centre.lng < -0.6 || centre.lng > 0.4
      ) {
        // Coordinates look wrong — fall back to central London
        map.setView([51.505, -0.09], 12);
        return;
      }
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
    } catch {
      map.setView([51.505, -0.09], 12);
    }
  }, [map, points]);
  return null;
}

// Pulsing dot for the user's current location
function UserLocationDot({ position }: { position: LatLngTuple }) {
  return (
    <>
      <Circle
        center={position}
        radius={80}
        pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.15, weight: 1 }}
      />
      <Circle
        center={position}
        radius={12}
        pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.9, weight: 2 }}
      />
    </>
  );
}

interface Props {
  legs: JourneyLeg[];
  userLocation?: { lat: number; lon: number } | null;
}

export default function JourneyMap({ legs, userLocation }: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  if (legs.length === 0) return null;

  type RoutePoint = {
    lat: number;
    lon: number;
    label: string;
    isStart?: boolean;
    isEnd?: boolean;
    isWaypoint?: boolean;
    mode?: string;
  };

  const points: RoutePoint[] = [];

  legs.forEach((leg, i) => {
    if (leg.fromLat != null && leg.fromLon != null) {
      points.push({
        lat: leg.fromLat,
        lon: leg.fromLon,
        label: leg.from,
        isStart: i === 0,
        mode: leg.mode,
      });
    }
    if (leg.path && leg.path.length > 0) {
      leg.path.forEach((p) => {
        // Deduplicate close points
        const last = points[points.length - 1];
        if (!last || Math.abs(last.lat - p.lat) > 0.00001 || Math.abs(last.lon - p.lon) > 0.00001) {
          points.push({ lat: p.lat, lon: p.lon, label: "" });
        }
      });
    }
    if (leg.toLat != null && leg.toLon != null) {
      // Mark intermediate transfer stations (not the final destination)
      const isLastLeg = i === legs.length - 1;
      points.push({
        lat: leg.toLat,
        lon: leg.toLon,
        label: leg.to,
        isEnd: isLastLeg,
        isWaypoint: !isLastLeg,
        mode: leg.mode,
      });
    }
  });

  // Sanity-check: all points must be within Greater London bounds
  const londonBounds = { minLat: 51.28, maxLat: 51.72, minLon: -0.51, maxLon: 0.33 };
  const validPoints = points.filter(
    (p) =>
      p.lat >= londonBounds.minLat &&
      p.lat <= londonBounds.maxLat &&
      p.lon >= londonBounds.minLon &&
      p.lon <= londonBounds.maxLon
  );

  if (validPoints.length < 2) return null;

  const latLngs: LatLngTuple[] = validPoints.map((p) => [p.lat, p.lon]);

  // Build per-leg polyline segments using only valid points
  const segments: { points: LatLngTuple[]; colour: string; weight: number; dashed: boolean }[] = legs.map((leg) => {
    const segPoints: LatLngTuple[] = [];
    if (leg.fromLat != null && leg.fromLon != null) segPoints.push([leg.fromLat, leg.fromLon]);
    if (leg.path && leg.path.length > 0) {
      leg.path.forEach((p) => segPoints.push([p.lat, p.lon]));
    }
    if (leg.toLat != null && leg.toLon != null) segPoints.push([leg.toLat, leg.toLon]);

    const isWalk = leg.mode === "walking" || leg.mode === "walk";
    return {
      points: segPoints.filter(
        ([lat, lon]) =>
          lat >= londonBounds.minLat && lat <= londonBounds.maxLat &&
          lon >= londonBounds.minLon && lon <= londonBounds.maxLon
      ),
      colour: MODE_COLOURS[leg.mode] ?? "#6b7280",
      weight: MODE_WEIGHT[leg.mode] ?? 5,
      dashed: isWalk,
    };
  });

  // Markers: only labelled stops (start, end, waypoints)
  const labelledPoints = validPoints.filter((p) => p.label && (p.isStart || p.isEnd || p.isWaypoint));

  const centre: LatLngTuple = [validPoints[0]?.lat ?? 51.505, validPoints[0]?.lon ?? -0.09];

  // Custom icons
  const startIcon = L.divIcon({
    html: `<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  const endIcon = L.divIcon({
    html: `<div style="background:#dc2626;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  const waypointIcon = L.divIcon({
    html: `<div style="background:#fff;width:10px;height:10px;border-radius:50%;border:2px solid #6b7280;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>`,
    className: "",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  return (
    <div className="h-[260px] overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-inner sm:h-[300px]">
      <MapContainer
        center={centre}
        zoom={13}
        minZoom={10}
        maxZoom={19}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
        // Restrict panning to Greater London area
        maxBounds={[[51.20, -0.65], [51.80, 0.45]]}
        maxBoundsViscosity={0.8}
      >
        {/* CartoDB Positron — clean, minimal, Google Maps-like */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <FitBounds points={latLngs} />

        {/* User location indicator */}
        {userLocation && (
          <UserLocationDot position={[userLocation.lat, userLocation.lon]} />
        )}

        {/* Route polylines — draw walk segments as dashed */}
        {segments.map((seg, i) =>
          seg.points.length >= 2 ? (
            <Polyline
              key={i}
              positions={seg.points}
              color={seg.colour}
              weight={seg.weight}
              opacity={0.9}
              dashArray={seg.dashed ? "6 8" : undefined}
            />
          ) : null
        )}

        {/* Station markers */}
        {labelledPoints.map((p, i) => {
          const icon = p.isStart ? startIcon : p.isEnd ? endIcon : waypointIcon;
          return (
            <Marker key={i} position={[p.lat, p.lon]} icon={icon}>
              {p.label && (
                <Popup closeButton={false} className="text-sm">
                  <strong>{p.label}</strong>
                  {p.mode && (
                    <span
                      style={{ color: MODE_COLOURS[p.mode] ?? "#6b7280" }}
                      className="ml-1 capitalize text-xs"
                    >
                      ({p.mode})
                    </span>
                  )}
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

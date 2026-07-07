"use client";

// JourneyMap renders a Leaflet map showing the route polyline and markers.
// Leaflet requires window/document — this component is always imported with
// dynamic(..., { ssr: false }) so it never runs on the server.
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
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

const MODE_COLOURS: Record<string, string> = {
  tube: "#dc2626",
  bus: "#ef4444",
  walking: "#16a34a",
  walk: "#16a34a",
  "elizabeth-line": "#7c3aed",
  overground: "#f97316",
  dlr: "#0d9488",
  tram: "#22c55e",
  "national-rail": "#374151",
};

// Component that adjusts map bounds to fit all route points
function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

interface Props {
  legs: JourneyLeg[];
}

export default function JourneyMap({ legs }: Props) {
  useEffect(() => { fixLeafletIcons(); }, []);

  if (legs.length === 0) return null;

  type RoutePoint = { lat: number; lon: number; label: string; isStart?: boolean; isEnd?: boolean };
  const points: RoutePoint[] = [];

  legs.forEach((leg, i) => {
    if (leg.fromLat && leg.fromLon) {
      points.push({ lat: leg.fromLat, lon: leg.fromLon, label: leg.from, isStart: i === 0 });
    }
    if (leg.path && leg.path.length > 0) {
      leg.path.forEach((p) => {
        if (!points.some((e) => e.lat === p.lat && e.lon === p.lon)) {
          points.push({ lat: p.lat, lon: p.lon, label: "" });
        }
      });
    }
    if (leg.toLat && leg.toLon) {
      points.push({ lat: leg.toLat, lon: leg.toLon, label: leg.to, isEnd: i === legs.length - 1 });
    }
  });

  if (points.length < 2) return null;

  const latLngs: LatLngTuple[] = points.map((p) => [p.lat, p.lon]);
  const labelledPoints = points.filter((p) => p.label);
  const centre: LatLngTuple = [points[0]?.lat ?? 51.505, points[0]?.lon ?? -0.09];

  const segments: { points: LatLngTuple[]; colour: string }[] = legs.map((leg) => {
    const segPoints: LatLngTuple[] = [];
    if (leg.fromLat && leg.fromLon) segPoints.push([leg.fromLat, leg.fromLon]);
    if (leg.path && leg.path.length > 0) {
      leg.path.forEach((p) => segPoints.push([p.lat, p.lon]));
    }
    if (leg.toLat && leg.toLon) segPoints.push([leg.toLat, leg.toLon]);
    return { points: segPoints, colour: MODE_COLOURS[leg.mode] ?? "#6b7280" };
  });

  const startIcon = L.divIcon({
    html: `<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  const endIcon = L.divIcon({
    html: `<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  const midIcon = L.divIcon({
    html: `<div style="background:#6b7280;width:8px;height:8px;border-radius:50%;border:1px solid white"></div>`,
    className: "",
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });

  return (
    <div className="mt-3 overflow-hidden rounded-xl border" style={{ height: 260 }}>
      <MapContainer
        center={centre}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        <FitBounds points={latLngs} />

        {segments.map((seg, i) =>
          seg.points.length >= 2 ? (
            <Polyline key={i} positions={seg.points} color={seg.colour} weight={4} opacity={0.85} />
          ) : null
        )}

        {labelledPoints.map((p, i) => {
          const icon = p.isStart ? startIcon : p.isEnd ? endIcon : midIcon;
          return (
            <Marker key={i} position={[p.lat, p.lon]} icon={icon}>
              {p.label && <Popup>{p.label}</Popup>}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

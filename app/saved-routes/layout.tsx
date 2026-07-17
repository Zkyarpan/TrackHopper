import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved routes — TrackHopper",
  description: "Keep your regular London journeys close at hand.",
};

export default function SavedRoutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

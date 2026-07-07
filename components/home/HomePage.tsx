"use client";

import { useEffect } from "react";
import { useJourneySearch } from "@/hooks/useJourneySearch";
import { useNearbyStations } from "@/hooks/useNearbyStations";
import AppHeader from "@/components/layout/AppHeader";
import Footer from "@/components/layout/Footer";
import LineStatusBanner from "@/components/status/LineStatusBanner";
import SearchSection from "@/components/home/SearchSection";
import JourneyResults from "@/components/home/JourneyResults";
import NearbySuggestions from "@/components/home/NearbySuggestions";
import EmptyState from "@/components/home/EmptyState";

export function HomePage() {
  const journey = useJourneySearch();
  const geo = useNearbyStations();

  // Prefill the "from" field once geolocation resolves a nearest station
  useEffect(() => {
    const station = geo.nearestStation;
    if (!station) return;
    if (journey.mode === "structured") {
      if (!journey.structFrom) journey.setStructFrom(station);
    } else {
      journey.setFreeText((prev) => (prev.startsWith("from ") ? prev : `from ${station.name} ${prev}`));
    }
  }, [geo.nearestStation]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-6">
        <LineStatusBanner />

        {geo.phase === "done" && (
          <NearbySuggestions
            stations={geo.stations}
            isLoading={geo.isLoading}
            onSelectFrom={(station) => {
              journey.setStructFrom(station);
              journey.setMode("structured");
            }}
            onRunSavedRoute={journey.runSavedRoute}
          />
        )}

        <SearchSection journey={journey} geo={geo} />

        {journey.journeys !== null && journey.journeys.length > 0 && (
          <JourneyResults journeys={journey.journeys} savePayload={journey.savePayload ?? undefined} />
        )}
        {journey.journeys !== null && journey.journeys.length === 0 && <EmptyState />}
      </main>
      <Footer />
    </div>
  );
}

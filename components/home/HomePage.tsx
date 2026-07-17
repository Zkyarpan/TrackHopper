"use client";

import { useEffect } from "react";
import { MapPinnedIcon, RadioTowerIcon, SparklesIcon } from "lucide-react";
import { useJourneySearch } from "@/hooks/useJourneySearch";
import { useNearbyStations } from "@/hooks/useNearbyStations";
import AppHeader from "@/components/layout/AppHeader";
import Footer from "@/components/layout/Footer";
import LineStatusBanner from "@/components/status/LineStatusBanner";
import SearchSection from "@/components/home/SearchSection";
import JourneyResults from "@/components/home/JourneyResults";
import NearbySuggestions from "@/components/home/NearbySuggestions";
import EmptyState from "@/components/home/EmptyState";
import { Badge } from "@/components/ui/badge";

export function HomePage() {
  const journey = useJourneySearch();
  const geo = useNearbyStations();

  useEffect(() => {
    const station = geo.nearestStation;
    if (!station) return;
    if (journey.mode === "structured") {
      if (!journey.structFrom) journey.setStructFrom(station);
    } else {
      journey.setFreeText((prev) =>
        prev.startsWith("from ") ? prev : `from ${station.name} ${prev}`,
      );
    }
  }, [geo.nearestStation]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 pb-12 sm:pb-16">
        <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
          <div className="grid items-start gap-8 lg:grid-cols-[0.83fr_1.17fr] lg:gap-12 xl:gap-16">
            <div className="animate-enter pt-1 lg:sticky lg:top-28 lg:pt-8">
              <Badge variant="secondary" className="mb-5 border border-primary/10 bg-primary/8 text-primary">
                <SparklesIcon />
                Smarter journeys across London
              </Badge>
              <h1 className="max-w-xl text-4xl leading-[1.02] font-bold tracking-[-0.055em] text-balance sm:text-5xl lg:text-[3.5rem]">
                London travel,
                <span className="text-primary"> without the guesswork.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Plan door-to-door journeys, check the network, and keep your regular routes close at hand.
              </p>

              <div className="mt-7 grid max-w-lg gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-white/75 bg-card/70 p-3.5 shadow-sm backdrop-blur-sm">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <RadioTowerIcon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Live network context</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">See disruptions before you set off.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/75 bg-card/70 p-3.5 shadow-sm backdrop-blur-sm">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <MapPinnedIcon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Built around you</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Use your location and saved trips.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 max-w-lg">
                <LineStatusBanner />
              </div>
            </div>

            <div className="animate-enter [animation-delay:100ms]">
              <SearchSection journey={journey} geo={geo} />
            </div>
          </div>

          {geo.phase === "done" && (
            <div className="mt-8 animate-enter">
              <NearbySuggestions
                stations={geo.stations}
                isLoading={geo.isLoading}
                onSelectFrom={(station) => {
                  journey.setStructFrom(station);
                  journey.setMode("structured");
                }}
                onRunSavedRoute={journey.runSavedRoute}
              />
            </div>
          )}

          {journey.journeys !== null && journey.journeys.length > 0 && (
            <JourneyResults
              journeys={journey.journeys}
              savePayload={journey.savePayload ?? undefined}
              userLocation={geo.coords ?? null}
            />
          )}
          {journey.journeys !== null && journey.journeys.length === 0 && <EmptyState />}
        </section>
      </main>
      <Footer />
    </div>
  );
}

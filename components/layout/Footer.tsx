import BrandMark from "@/components/layout/BrandMark";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/65">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandMark className="size-8 rounded-[11px] shadow-none" />
          <div>
            <p className="text-sm font-semibold tracking-[-0.01em]">TrackHopper</p>
            <p className="text-xs text-muted-foreground">Made for smoother London journeys.</p>
          </div>
        </div>
        <p className="max-w-md text-xs leading-5 text-muted-foreground sm:text-right">
          Journey and service data from TfL <span aria-hidden="true">•</span> Station search powered by OpenStreetMap
        </p>
      </div>
    </footer>
  );
}

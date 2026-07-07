import { TrainFront, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 md:flex-row">
        <div className="flex items-center gap-2">
          <TrainFront className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            TrackHopper
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Powered by <strong>TfL</strong> • Station search via{" "}
          <strong>OpenStreetMap Nominatim</strong>
        </p>

        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          Made by Zkyarpan<Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
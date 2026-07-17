import { Suspense } from "react";
import { HomePage } from "@/components/home/HomePage";
import BrandMark from "@/components/layout/BrandMark";
import { Skeleton } from "@/components/ui/skeleton";

function HomePageFallback() {
  return (
    <div className="app-shell min-h-screen">
      <header className="border-b border-border/70 bg-background/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <BrandMark className="size-9" />
          <div>
            <p className="text-[17px] font-bold tracking-[-0.035em]">TrackHopper</p>
            <p className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">London, in motion</p>
          </div>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[0.83fr_1.17fr] lg:px-8 lg:pt-16">
        <div className="space-y-4 pt-8">
          <Skeleton className="h-6 w-52 rounded-full" />
          <Skeleton className="h-14 w-full max-w-md" />
          <Skeleton className="h-14 w-4/5 max-w-sm" />
          <Skeleton className="h-20 w-full max-w-lg" />
        </div>
        <Skeleton className="h-[540px] w-full rounded-[28px]" />
      </main>
    </div>
  );
}

// Wrap with Suspense because useSearchParams() requires it in the App Router
export default function Page() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePage />
    </Suspense>
  );
}

import { Suspense } from "react";
import { HomePage } from "@/components/home/HomePage";

// Wrap with Suspense because useSearchParams() requires it in the App Router
export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}

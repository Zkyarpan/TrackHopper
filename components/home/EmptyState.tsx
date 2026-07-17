import { SearchXIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmptyState() {
  return (
    <Card className="mt-10 rounded-3xl border-dashed bg-card/75">
      <CardContent className="flex flex-col items-center py-12 text-center sm:py-16">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <SearchXIcon className="size-6" />
        </span>
        <p className="text-lg font-semibold tracking-[-0.02em]">No routes found</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          Try another nearby station or adjust when you want to travel.
        </p>
      </CardContent>
    </Card>
  );
}

"use client";

import { useLineStatus } from "@/hooks/useLineStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CircleCheckIcon, RadioTowerIcon, TriangleAlertIcon } from "lucide-react";
import LineStatusDetail from "@/components/status/LineStatusDetail";

const DISRUPTED = new Set([
  "minor delays",
  "severe delays",
  "part suspended",
  "suspended",
  "part closure",
  "closed",
  "bus service",
  "special service",
  "reduced service",
  "not running",
]);

export default function LineStatusBanner() {
  const { statuses, isLoading, error } = useLineStatus();

  if (isLoading) {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertDescription>
          <span className="font-semibold">Network status unavailable</span>
        </AlertDescription>
      </Alert>
    );
  }

  const disrupted = statuses.filter((l) => DISRUPTED.has(l.status.toLowerCase()));

  if (disrupted.length === 0) {
    return (
      <Alert variant="success" className="bg-card/75 backdrop-blur-sm">
        <CircleCheckIcon />
        <AlertDescription className="flex items-center justify-between gap-3 text-inherit">
          <span className="font-semibold">Good service on all lines</span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] opacity-65 sm:inline">Live status</span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="bg-card/80 py-2 backdrop-blur-sm">
      <Accordion>
        <AccordionItem value="alerts" className="border-none">
          <AccordionTrigger className="py-1 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-destructive/10">
                <RadioTowerIcon className="size-3.5" />
              </span>
              <span className="font-semibold">
                {disrupted.length === 1 ? "1 service alert" : `${disrupted.length} service alerts`}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <LineStatusDetail lines={disrupted} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Alert>
  );
}

"use client";

import { useLineStatus } from "@/hooks/useLineStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
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
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertDescription>Line status unavailable</AlertDescription>
      </Alert>
    );
  }

  const disrupted = statuses.filter((l) => DISRUPTED.has(l.status.toLowerCase()));

  if (disrupted.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
        <CircleCheckIcon />
        <AlertDescription className="font-medium text-inherit">
          Good service on all lines
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="py-1">
      <Accordion>
        <AccordionItem value="alerts" className="border-none">
          <AccordionTrigger className="py-1.5 text-sm hover:no-underline">
            <span className="flex items-center gap-2">
              <TriangleAlertIcon className="h-4 w-4" />
              {disrupted.length === 1 ? "1 service alert" : `${disrupted.length} service alerts`}
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

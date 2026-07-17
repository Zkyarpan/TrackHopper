"use client";

import { ArrowUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface Props {
  onSwap: () => void;
  disabled?: boolean;
}

export default function StationSwapButton({ onSwap, disabled }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-border bg-card text-primary shadow-sm hover:rotate-180"
            onClick={onSwap}
            disabled={disabled}
            aria-label="Swap departure and destination"
          />
        }
      >
        <ArrowUpDownIcon />
      </TooltipTrigger>
      <TooltipContent>Swap stations</TooltipContent>
    </Tooltip>
  );
}

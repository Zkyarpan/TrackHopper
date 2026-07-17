import { cn } from "@/lib/utils";

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-primary shadow-[0_8px_20px_color-mix(in_oklch,var(--primary)_24%,transparent)]",
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="size-full" fill="none">
        <path
          d="M8.5 27.5c4.5 0 5.5-15 11.5-15 4.25 0 5.25 9 11.5 9"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="8.5" cy="27.5" r="3.5" fill="white" />
        <circle cx="20" cy="12.5" r="3.5" fill="white" />
        <circle cx="31.5" cy="21.5" r="4" fill="var(--brand)" stroke="white" strokeWidth="2" />
      </svg>
    </span>
  );
}

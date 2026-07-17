import type { LineStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

function severity(status: string): "destructive" | "outline" {
  const s = status.toLowerCase();
  return s === "minor delays" ? "outline" : "destructive";
}

export default function LineStatusDetail({ lines }: { lines: LineStatus[] }) {
  const list = (
    <div className="space-y-2 pt-1">
      {lines.map((line) => (
        <div key={line.id} className="rounded-xl border border-destructive/10 bg-card/70 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{line.name}</span>
            <Badge variant={severity(line.status)}>{line.status}</Badge>
          </div>
          {line.reason && (
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {line.reason.replace(/^[^:]+:\s*/, "")}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  if (lines.length > 5) {
    return <ScrollArea className="h-48 pr-3">{list}</ScrollArea>;
  }
  return list;
}

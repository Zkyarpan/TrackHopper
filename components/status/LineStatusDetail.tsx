import type { LineStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

function severity(status: string): "destructive" | "outline" {
  const s = status.toLowerCase();
  return s === "minor delays" ? "outline" : "destructive";
}

export default function LineStatusDetail({ lines }: { lines: LineStatus[] }) {
  const list = (
    <div className="space-y-2">
      {lines.map((line) => (
        <div key={line.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{line.name}</span>
          <Badge variant={severity(line.status)}>{line.status}</Badge>
          {line.reason && (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {line.reason.replace(/^[^:]+:\s*/, "")}
            </span>
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

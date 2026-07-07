import { TrainFrontIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmptyState() {
  return (
    <Card className="mt-6">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <TrainFrontIcon className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No routes found between those stations.</p>
      </CardContent>
    </Card>
  );
}

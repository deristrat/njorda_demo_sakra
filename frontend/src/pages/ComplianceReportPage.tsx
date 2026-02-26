import { useEffect } from "react";
import { FileBarChart } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";

export function ComplianceReportPage() {
  useEffect(() => {
    document.title = "Compliance rapport — Säkra";
  }, []);

  return (
    <>
      <AppHeader title="Compliance rapport" />
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileBarChart className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="font-brand text-lg">Compliance rapport</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Här kommer du kunna generera och granska sammanfattande
                compliance-rapporter med statistik, trender och
                åtgärdsrekommendationer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

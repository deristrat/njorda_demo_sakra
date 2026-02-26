import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";

export function AuditPage() {
  useEffect(() => {
    document.title = "Audit — Säkra";
  }, []);

  return (
    <>
      <AppHeader title="Audit" />
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="font-brand text-lg">Audit</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Här kommer du kunna se en fullständig granskningslogg av alla
                compliance-händelser, regeländringar och dokumentgranskningar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

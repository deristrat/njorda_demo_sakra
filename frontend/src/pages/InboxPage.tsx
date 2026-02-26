import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { Card, CardContent } from "@/components/ui/card";
import { fetchDocuments } from "@/lib/api";
import type { DocumentSummary } from "@/types";
import { toast } from "sonner";

export function InboxPage() {
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchDocuments()
      .then((all) =>
        setDocs(
          all.filter(
            (d) =>
              d.compliance_status === "red" || d.compliance_status === "yellow",
          ),
        ),
      )
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Något gick fel"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = "Inkorg — Säkra";
    load();
  }, []);

  return (
    <>
      <AppHeader title="Inkorg" />
      <div className="p-6">
        {!loading && docs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
                <Inbox className="size-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <h2 className="font-brand text-lg">Inga ärenden</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Alla dokument är godkända. Det finns inga avvikelser att
                  hantera just nu.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DocumentsTable
            externalData={docs}
            externalLoading={loading}
            onRefresh={load}
          />
        )}
      </div>
    </>
  );
}

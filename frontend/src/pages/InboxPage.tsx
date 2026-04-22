import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { Card, CardContent } from "@/components/ui/card";
import { fetchDocuments } from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/language";
import type { DocumentSummary } from "@/types";
import { toast } from "sonner";

const translations = {
  sv: {
    pageTitle: "Inkorg — Säkra",
    headerTitle: "Inkorg",
    emptyTitle: "Inga ärenden",
    emptyBody:
      "Alla dokument är godkända. Det finns inga avvikelser att hantera just nu.",
    somethingWentWrong: "Något gick fel",
  },
  en: {
    pageTitle: "Inbox — Säkra",
    headerTitle: "Inbox",
    emptyTitle: "No cases",
    emptyBody:
      "All documents are approved. There are no issues to handle right now.",
    somethingWentWrong: "Something went wrong",
  },
} satisfies Record<Lang, Record<string, string>>;

export function InboxPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
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
        toast.error(e instanceof Error ? e.message : t.somethingWentWrong),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = t.pageTitle;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.pageTitle]);

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6">
        {!loading && docs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
                <Inbox className="size-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <h2 className="font-brand text-lg">{t.emptyTitle}</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {t.emptyBody}
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

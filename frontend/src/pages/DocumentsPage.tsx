import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    pageTitle: "Dokument — Säkra",
    headerTitle: "Dokument",
  },
  en: {
    pageTitle: "Documents — Säkra",
    headerTitle: "Documents",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocumentsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6">
        <DocumentsTable />
      </div>
    </>
  );
}

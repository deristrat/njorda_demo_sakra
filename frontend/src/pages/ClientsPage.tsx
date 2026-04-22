import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    pageTitle: "Klienter — Säkra",
    headerTitle: "Klienter",
  },
  en: {
    pageTitle: "Clients — Säkra",
    headerTitle: "Clients",
  },
} satisfies Record<Lang, Record<string, string>>;

export function ClientsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6">
        <ClientsTable />
      </div>
    </>
  );
}

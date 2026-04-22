import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdvisorsListTable } from "@/components/advisors/AdvisorsListTable";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    pageTitle: "Rådgivare — Säkra",
    headerTitle: "Rådgivare",
  },
  en: {
    pageTitle: "Advisors — Säkra",
    headerTitle: "Advisors",
  },
} satisfies Record<Lang, Record<string, string>>;

export function AdvisorsListPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6">
        <AdvisorsListTable />
      </div>
    </>
  );
}

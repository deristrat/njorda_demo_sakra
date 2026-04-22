import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ComponentShowcase } from "@/components/settings/ComponentShowcase";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    pageTitle: "Inställningar — Säkra",
    headerTitle: "Inställningar",
  },
  en: {
    pageTitle: "Settings — Säkra",
    headerTitle: "Settings",
  },
} satisfies Record<Lang, Record<string, string>>;

export function SettingsPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6">
        <ComponentShowcase />
      </div>
    </>
  );
}

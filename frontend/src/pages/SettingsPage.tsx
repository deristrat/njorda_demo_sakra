import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ComponentShowcase } from "@/components/settings/ComponentShowcase";

export function SettingsPage() {
  useEffect(() => {
    document.title = "Inställningar — Säkra";
  }, []);

  return (
    <>
      <AppHeader title="Inställningar" />
      <div className="p-6">
        <ComponentShowcase />
      </div>
    </>
  );
}

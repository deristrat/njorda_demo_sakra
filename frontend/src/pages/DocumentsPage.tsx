import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { DocumentsTable } from "@/components/documents/DocumentsTable";

export function DocumentsPage() {
  useEffect(() => {
    document.title = "Dokument — Säkra";
  }, []);

  return (
    <>
      <AppHeader title="Dokument" />
      <div className="p-6">
        <DocumentsTable />
      </div>
    </>
  );
}

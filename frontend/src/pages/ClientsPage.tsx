import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ClientsTable } from "@/components/clients/ClientsTable";

export function ClientsPage() {
  useEffect(() => {
    document.title = "Klienter — Njorda Advisor";
  }, []);

  return (
    <>
      <AppHeader title="Klienter" />
      <div className="p-6">
        <ClientsTable />
      </div>
    </>
  );
}

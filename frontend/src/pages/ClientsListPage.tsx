import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ClientsListTable } from "@/components/clients/ClientsListTable";

export function ClientsListPage() {
  useEffect(() => {
    document.title = "Klienter — Njorda Advisor";
  }, []);

  return (
    <>
      <AppHeader title="Klienter" />
      <div className="p-6">
        <ClientsListTable />
      </div>
    </>
  );
}

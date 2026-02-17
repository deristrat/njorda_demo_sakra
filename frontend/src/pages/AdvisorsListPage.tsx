import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdvisorsListTable } from "@/components/advisors/AdvisorsListTable";

export function AdvisorsListPage() {
  useEffect(() => {
    document.title = "Rådgivare — Njorda Advisor";
  }, []);

  return (
    <>
      <AppHeader title="Rådgivare" />
      <div className="p-6">
        <AdvisorsListTable />
      </div>
    </>
  );
}

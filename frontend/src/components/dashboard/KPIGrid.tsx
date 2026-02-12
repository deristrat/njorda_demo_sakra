import { kpis } from "@/data/kpis";
import { KPICard } from "./KPICard";

export function KPIGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
}

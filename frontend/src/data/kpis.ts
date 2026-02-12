import type { KPI } from "@/types";

export const kpis: KPI[] = [
  {
    id: "clients",
    label: "Antal klienter",
    value: "247",
    trend: 3.2,
    icon: "Users",
  },
  {
    id: "meetings",
    label: "Möten senaste veckan",
    value: "18",
    trend: 12.5,
    icon: "Calendar",
  },
  {
    id: "aum",
    label: "AUM",
    value: "1,42 mdr kr",
    trend: 5.8,
    icon: "TrendingUp",
  },
  {
    id: "net-new",
    label: "Netto nya tillgångar",
    value: "+32,5 mkr",
    trend: 8.1,
    icon: "ArrowUpRight",
  },
  {
    id: "satisfaction",
    label: "Kundnöjdhet",
    value: "4,7 / 5",
    trend: 1.2,
    icon: "Star",
  },
  {
    id: "actions",
    label: "Väntande åtgärder",
    value: "12",
    trend: -15.3,
    icon: "AlertCircle",
  },
];

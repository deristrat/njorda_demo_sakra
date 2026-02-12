import type { PortfolioAllocation, AumTrendPoint, MeetingsWeek } from "@/types";

export const portfolioAllocation: PortfolioAllocation[] = [
  { name: "Aktier", value: 45, color: "#03A48D" },
  { name: "Räntor", value: 25, color: "#1B3740" },
  { name: "Alternativa", value: 15, color: "#F985A0" },
  { name: "Fastigheter", value: 10, color: "#688F9A" },
  { name: "Likviditet", value: 5, color: "#D4A574" },
];

export const aumTrend: AumTrendPoint[] = [
  { month: "Jan", total: 1280, equity: 576, fixedIncome: 320 },
  { month: "Feb", total: 1295, equity: 583, fixedIncome: 324 },
  { month: "Mar", total: 1310, equity: 590, fixedIncome: 328 },
  { month: "Apr", total: 1285, equity: 578, fixedIncome: 321 },
  { month: "Maj", total: 1330, equity: 599, fixedIncome: 333 },
  { month: "Jun", total: 1355, equity: 610, fixedIncome: 339 },
  { month: "Jul", total: 1340, equity: 603, fixedIncome: 335 },
  { month: "Aug", total: 1370, equity: 617, fixedIncome: 343 },
  { month: "Sep", total: 1390, equity: 626, fixedIncome: 348 },
  { month: "Okt", total: 1405, equity: 632, fixedIncome: 351 },
  { month: "Nov", total: 1395, equity: 628, fixedIncome: 349 },
  { month: "Dec", total: 1420, equity: 639, fixedIncome: 355 },
];

export const meetingsPerWeek: MeetingsWeek[] = [
  { week: "V.1", meetings: 14, target: 15 },
  { week: "V.2", meetings: 18, target: 15 },
  { week: "V.3", meetings: 12, target: 15 },
  { week: "V.4", meetings: 20, target: 15 },
  { week: "V.5", meetings: 16, target: 15 },
  { week: "V.6", meetings: 22, target: 15 },
  { week: "V.7", meetings: 15, target: 15 },
  { week: "V.8", meetings: 18, target: 15 },
];

export interface KPI {
  id: string;
  label: string;
  value: string;
  trend: number;
  icon: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  city: string;
  aum: number;
  aumFormatted: string;
  lastContact: string;
  status: "Aktiv" | "Inaktiv" | "Ny";
  attention: boolean;
  attentionReason?: string;
  riskProfile: "Låg" | "Medel" | "Hög";
  custodian: string;
}

export interface PortfolioAllocation {
  name: string;
  value: number;
  color: string;
}

export interface AumTrendPoint {
  month: string;
  total: number;
  equity: number;
  fixedIncome: number;
}

export interface MeetingsWeek {
  week: string;
  meetings: number;
  target: number;
}

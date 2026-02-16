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

// Document types

export interface DocumentSummary {
  id: number;
  original_filename: string;
  file_size: number;
  status: string;
  created_at: string;
  document_type: string | null;
  document_date: string | null;
  client_name: string | null;
  advisor_name: string | null;
  page_count: number | null;
  compliance_status: string | null;
  compliance_score: number | null;
  compliance_summary: ComplianceSummaryData | null;
}

export interface ExtractionSummary {
  id: number;
  extractor_name: string;
  status: string;
  error_message: string | null;
  document_type: string | null;
  document_date: string | null;
  page_count: number | null;
  client_name: string | null;
  advisor_name: string | null;
  extraction_data: ExtractionData | null;
  created_at: string;
}

export interface DocumentDetail {
  id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  extractions: ExtractionSummary[];
}

export interface ExtractionData {
  source_filename: string;
  extractor_name: string;
  document_type: string | null;
  document_date: string | null;
  page_count: number | null;
  client: {
    person_number: string | null;
    person_name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  advisor: {
    advisor_name: string | null;
    firm_name: string | null;
    license_number: string | null;
  } | null;
  suitability: {
    risk_profile: string | null;
    investment_horizon: string | null;
    experience_level: string | null;
    financial_situation: string | null;
    investment_objective: string | null;
    loss_tolerance: string | null;
  } | null;
  recommendations: Array<{
    product_name: string | null;
    isin: string | null;
    amount: number | null;
    percentage: number | null;
    motivation: string | null;
  }> | null;
  pension_provider_from: string | null;
  pension_provider_to: string | null;
  transfer_amount: number | null;
  confidence_notes: string[];
}

export interface ProcessEvent {
  id?: number;
  status: string;
  message?: string;
  document_type?: string;
  client_name?: string;
  compliance_status?: string;
  compliance_score?: number;
}

// Compliance types

export interface ComplianceSummaryData {
  total_rules: number;
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
  errors: number;
}

export interface ComplianceFinding {
  message: string;
  context?: Record<string, unknown>;
}

export interface ComplianceRuleOutcome {
  rule_id: string;
  rule_name: string;
  category: string;
  tier: number;
  rule_type: string;
  status: "passed" | "failed" | "skipped";
  severity: string;
  findings: ComplianceFinding[];
  remediation: string | null;
}

export interface ComplianceReport {
  outcomes: ComplianceRuleOutcome[];
  score: number;
  status: "green" | "yellow" | "red";
  summary: ComplianceSummaryData;
}

export interface ComplianceRuleConfig {
  rule_id: string;
  name: string;
  description: string | null;
  category: string;
  tier: number;
  rule_type: string;
  rule_params: Record<string, unknown> | null;
  document_types: string[] | null;
  default_severity: string;
  severity_override: string | null;
  max_deduction: number;
  remediation: string | null;
  parent_rule_id: string | null;
  enabled: boolean;
  sort_order: number;
}

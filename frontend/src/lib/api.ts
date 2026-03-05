import type {
  Advisor,
  AdvisorDetail,
  Client,
  ClientDetail,
  DocumentSummary,
  DocumentDetail,
  ProcessEvent,
  ComplianceReport,
  ComplianceRuleConfig,
  ComplianceReportRunSummary,
  ComplianceReportRunDetail,
} from "@/types";
import { getAuthHeaders } from "@/lib/auth";

const BASE = "/api/documents";

/** Fetch wrapper that injects auth headers and handles 401. */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const auth = getAuthHeaders();
  for (const [k, v] of Object.entries(auth)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_name");
    localStorage.removeItem("auth_user_id");
    localStorage.removeItem("auth_advisor_id");
    window.location.href = "/login";
  }
  return res;
}

/** Parse error detail from a failed response. */
async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body.detail) return body.detail;
  } catch { /* ignore parse errors */ }
  return `${fallback}: ${res.status}`;
}

export async function uploadDocuments(
  files: File[],
  clientId?: number,
): Promise<{ documents: Array<{ id: number; filename: string; size: number; duplicate_warning: string | null }> }> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  const url = clientId != null ? `${BASE}/upload?client_id=${clientId}` : `${BASE}/upload`;
  const res = await apiFetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(await parseError(res, "Uppladdning misslyckades"));
  return res.json();
}

export function processDocumentsSSE(
  ids: number[],
  onEvent: (event: ProcessEvent) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): () => void {
  const url = `${BASE}/process?ids=${ids.join(",")}`;
  const evtSource = new EventSource(url);

  evtSource.onmessage = (e) => {
    try {
      const data: ProcessEvent = JSON.parse(e.data);
      onEvent(data);
      if (data.status === "all_done") {
        evtSource.close();
        onDone();
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  evtSource.onerror = () => {
    evtSource.close();
    onError(new Error("SSE-anslutningen bröts"));
  };

  return () => evtSource.close();
}

export async function deleteDocuments(ids: number[]): Promise<{ deleted: number }> {
  const res = await apiFetch(`${BASE}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Radering misslyckades"));
  return res.json();
}

export async function bulkRecheckCompliance(
  ids: number[],
): Promise<{ results: Array<{ id: number; status: string; message?: string }> }> {
  const res = await apiFetch(`${BASE}/bulk-recheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Omkontroll misslyckades"));
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta dokument"));
  return res.json();
}

export async function fetchDocument(id: number): Promise<DocumentDetail> {
  const res = await apiFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta dokument"));
  return res.json();
}

export function getDocumentFileUrl(id: number): string {
  const token = localStorage.getItem("auth_token");
  const base = `${BASE}/${id}/file`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// --- Clients ---

export async function fetchClients(): Promise<Client[]> {
  const res = await apiFetch("/api/clients");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta klienter"));
  return res.json();
}

export async function fetchClient(id: number): Promise<ClientDetail> {
  const res = await apiFetch(`/api/clients/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta klient"));
  return res.json();
}

export async function fetchClientDocuments(id: number): Promise<DocumentSummary[]> {
  const res = await apiFetch(`/api/clients/${id}/documents`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta dokument"));
  return res.json();
}

// --- Advisors ---

export async function fetchAdvisors(): Promise<Advisor[]> {
  const res = await apiFetch("/api/advisors");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta rådgivare"));
  return res.json();
}

export async function fetchAdvisor(id: number): Promise<AdvisorDetail> {
  const res = await apiFetch(`/api/advisors/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta rådgivare"));
  return res.json();
}

export async function fetchAdvisorDocuments(id: number): Promise<DocumentSummary[]> {
  const res = await apiFetch(`/api/advisors/${id}/documents`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta dokument"));
  return res.json();
}

// --- Settings ---

export interface ExtractorModel {
  name: string;
  provider: string;
  model_id: string;
}

export async function fetchExtractorModels(): Promise<ExtractorModel[]> {
  const res = await apiFetch("/api/settings/extractor-models");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta modeller"));
  return res.json();
}

export async function fetchExtractorModel(): Promise<string> {
  const res = await apiFetch("/api/settings/extractor-model");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta modell"));
  const data = await res.json();
  return data.model;
}

export async function setExtractorModel(model: string): Promise<void> {
  const res = await apiFetch("/api/settings/extractor-model", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte uppdatera modell"));
}

// --- Compliance ---

export async function fetchComplianceRules(): Promise<ComplianceRuleConfig[]> {
  const res = await apiFetch("/api/compliance/rules");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta regler"));
  return res.json();
}

export async function updateComplianceRule(
  ruleId: string,
  update: {
    enabled?: boolean;
    severity_override?: string | null;
    name?: string;
    remediation?: string | null;
    max_deduction?: number;
    description?: string;
    rule_params?: Record<string, unknown>;
    document_types?: string[];
    parent_rule_id?: string | null;
  },
): Promise<ComplianceRuleConfig> {
  const res = await apiFetch(`/api/compliance/rules/${ruleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte uppdatera regel"));
  return res.json();
}

export async function fetchDocumentCompliance(
  documentId: number,
): Promise<ComplianceReport> {
  const res = await apiFetch(`/api/compliance/documents/${documentId}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta regelefterlevnad"));
  return res.json();
}

export async function recheckDocumentCompliance(
  documentId: number,
): Promise<ComplianceReport> {
  const res = await apiFetch(`/api/compliance/documents/${documentId}/recheck`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await parseError(res, "Omkontroll misslyckades"));
  return res.json();
}

export async function fetchComplianceThresholds(): Promise<{
  green: number;
  yellow: number;
}> {
  const res = await apiFetch("/api/compliance/thresholds");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta tröskelvärden"));
  return res.json();
}

export async function updateComplianceThresholds(
  thresholds: { green?: number; yellow?: number },
): Promise<{ green: number; yellow: number }> {
  const res = await apiFetch("/api/compliance/thresholds", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(thresholds),
  });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte uppdatera tröskelvärden"));
  return res.json();
}

// --- Compliance Reports ---

export async function generateComplianceReport(): Promise<ComplianceReportRunDetail> {
  const res = await apiFetch("/api/reports/compliance", { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte generera rapport"));
  return res.json();
}

export async function fetchComplianceReports(): Promise<ComplianceReportRunSummary[]> {
  const res = await apiFetch("/api/reports/compliance");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta rapporter"));
  return res.json();
}

export async function fetchComplianceReport(id: number): Promise<ComplianceReportRunDetail> {
  const res = await apiFetch(`/api/reports/compliance/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta rapport"));
  return res.json();
}

// --- Audit ---

export interface AuditEntry {
  id: number;
  rule_id: string;
  action: string;
  changed_by: string;
  changed_at: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown>;
}

export async function fetchRuleHistory(ruleId: string): Promise<AuditEntry[]> {
  const res = await apiFetch(`/api/compliance/rules/${ruleId}/history`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta historik"));
  return res.json();
}

// --- Audit Events (system-wide) ---

export interface AuditEventListItem {
  id: number;
  event_type: string;
  actor: string;
  target_type: string | null;
  target_id: string | null;
  summary: string;
  created_at: string;
}

export interface AuditEventDetail extends AuditEventListItem {
  detail: Record<string, unknown> | null;
}

export async function fetchAuditEvents(params?: {
  event_type?: string;
  search?: string;
}): Promise<AuditEventListItem[]> {
  const query = new URLSearchParams();
  if (params?.event_type) query.set("event_type", params.event_type);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/api/audit${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta händelser"));
  return res.json();
}

export async function fetchAuditEvent(id: number): Promise<AuditEventDetail> {
  const res = await apiFetch(`/api/audit/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta händelse"));
  return res.json();
}

// --- Create rule ---

export async function createComplianceRule(
  rule: {
    rule_id: string;
    name: string;
    category: string;
    rule_type: string;
    default_severity: string;
    description?: string;
    rule_params?: Record<string, unknown>;
    document_types?: string[];
    parent_rule_id?: string | null;
    tier?: number;
    max_deduction?: number;
    remediation?: string;
    enabled?: boolean;
  },
): Promise<ComplianceRuleConfig> {
  const res = await apiFetch("/api/compliance/rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte skapa regel"));
  return res.json();
}

// --- Users & Impersonation ---

export interface AppUser {
  id: number;
  username: string;
  name: string | null;
  role: string;
}

// --- Messages ---

export async function fetchMessages(unreadOnly = false): Promise<import("@/types").MessageItem[]> {
  const qs = unreadOnly ? "?unread_only=true" : "";
  const res = await apiFetch(`/api/messages/${qs}`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta meddelanden"));
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch("/api/messages/unread-count");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta antal olästa"));
  const data = await res.json();
  return data.unread_count;
}

export async function createMessage(payload: {
  recipient_user_id?: number;
  document_id?: number;
  client_id?: number;
  advisor_id?: number;
  subject: string;
  body: string;
}): Promise<import("@/types").MessageItem> {
  const res = await apiFetch("/api/messages/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte skicka meddelande"));
  return res.json();
}

export async function markMessageRead(id: number): Promise<void> {
  const res = await apiFetch(`/api/messages/${id}/read`, { method: "PUT" });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte markera som läst"));
}

export async function fetchMessageThread(id: number): Promise<import("@/types").MessageItem[]> {
  const res = await apiFetch(`/api/messages/${id}/thread`);
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta tråd"));
  return res.json();
}

export async function replyToMessage(id: number, body: string): Promise<import("@/types").MessageItem> {
  const res = await apiFetch(`/api/messages/${id}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte skicka svar"));
  return res.json();
}

// --- Users & Impersonation ---

export async function fetchUsers(): Promise<AppUser[]> {
  const res = await apiFetch("/api/auth/users");
  if (!res.ok) throw new Error(await parseError(res, "Kunde inte hämta användare"));
  return res.json();
}

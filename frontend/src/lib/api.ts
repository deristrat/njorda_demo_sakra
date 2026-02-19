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
    window.location.href = "/login";
  }
  return res;
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
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
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
    onError(new Error("SSE connection lost"));
  };

  return () => evtSource.close();
}

export async function deleteDocuments(ids: number[]): Promise<{ deleted: number }> {
  const res = await fetch(`${BASE}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}

export async function bulkRecheckCompliance(
  ids: number[],
): Promise<{ results: Array<{ id: number; status: string; message?: string }> }> {
  const res = await fetch(`${BASE}/bulk-recheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`Recheck failed: ${res.status}`);
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchDocument(id: number): Promise<DocumentDetail> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export function getDocumentFileUrl(id: number): string {
  return `${BASE}/${id}/file`;
}

// --- Clients ---

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch("/api/clients");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchClient(id: number): Promise<ClientDetail> {
  const res = await fetch(`/api/clients/${id}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchClientDocuments(id: number): Promise<DocumentSummary[]> {
  const res = await fetch(`/api/clients/${id}/documents`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

// --- Advisors ---

export async function fetchAdvisors(): Promise<Advisor[]> {
  const res = await fetch("/api/advisors");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAdvisor(id: number): Promise<AdvisorDetail> {
  const res = await fetch(`/api/advisors/${id}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAdvisorDocuments(id: number): Promise<DocumentSummary[]> {
  const res = await fetch(`/api/advisors/${id}/documents`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

// --- Settings ---

export interface ExtractorModel {
  name: string;
  provider: string;
  model_id: string;
}

export async function fetchExtractorModels(): Promise<ExtractorModel[]> {
  const res = await fetch("/api/settings/extractor-models");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchExtractorModel(): Promise<string> {
  const res = await fetch("/api/settings/extractor-model");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  return data.model;
}

export async function setExtractorModel(model: string): Promise<void> {
  const res = await fetch("/api/settings/extractor-model", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
}

// --- Compliance ---

export async function fetchComplianceRules(): Promise<ComplianceRuleConfig[]> {
  const res = await fetch("/api/compliance/rules");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
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
  if (!res.ok) {
    let message = `Update failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) message = body.detail;
    } catch { /* ignore parse errors */ }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchDocumentCompliance(
  documentId: number,
): Promise<ComplianceReport> {
  const res = await fetch(`/api/compliance/documents/${documentId}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function recheckDocumentCompliance(
  documentId: number,
): Promise<ComplianceReport> {
  const res = await fetch(`/api/compliance/documents/${documentId}/recheck`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Recheck failed: ${res.status}`);
  return res.json();
}

export async function fetchComplianceThresholds(): Promise<{
  green: number;
  yellow: number;
}> {
  const res = await fetch("/api/compliance/thresholds");
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function updateComplianceThresholds(
  thresholds: { green?: number; yellow?: number },
): Promise<{ green: number; yellow: number }> {
  const res = await fetch("/api/compliance/thresholds", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(thresholds),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
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
  const res = await fetch(`/api/compliance/rules/${ruleId}/history`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
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
  if (!res.ok) {
    let message = `Create failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) message = body.detail;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json();
}

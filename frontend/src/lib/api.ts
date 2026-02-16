import type {
  DocumentSummary,
  DocumentDetail,
  ProcessEvent,
  ComplianceReport,
  ComplianceRuleConfig,
} from "@/types";

const BASE = "/api/documents";

export async function uploadDocuments(
  files: File[],
): Promise<{ documents: Array<{ id: number; filename: string; size: number; duplicate_warning: string | null }> }> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
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
  update: { enabled?: boolean; severity_override?: string | null },
): Promise<ComplianceRuleConfig> {
  const res = await fetch(`/api/compliance/rules/${ruleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
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

import type { DocumentSummary, DocumentDetail, ProcessEvent } from "@/types";

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

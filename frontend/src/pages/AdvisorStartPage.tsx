import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { FileText, Users, CheckCircle2, Inbox, Upload, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AdvisorChat } from "@/components/chat/AdvisorChat";
import { fetchDocuments, fetchClients, uploadDocuments, processDocumentsSSE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat-context";
import type { DocumentSummary, Client } from "@/types";

export function AdvisorStartPage() {
  const navigate = useNavigate();
  const { name, isImpersonating, impersonatingAs } = useAuth();
  const displayName = isImpersonating && impersonatingAs
    ? impersonatingAs.name
    : name;
  const { messages } = useChat();
  const chatActive = messages.length > 0;
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "done" | "error"
  >("idle");
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [uploadedDocIds, setUploadedDocIds] = useState<number[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleFilesUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploadedFileNames(files.map((f) => f.name));
      setUploadStatus("uploading");
      try {
        const result = await uploadDocuments(files);
        const docIds = result.documents.map((d) => d.id);
        setUploadedDocIds(docIds);
        setUploadStatus("processing");
        processDocumentsSSE(
          docIds,
          () => {},
          () => setUploadStatus("done"),
          () => setUploadStatus("error"),
        );
      } catch {
        setUploadStatus("error");
      }
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFilesUpload(Array.from(e.dataTransfer.files));
    },
    [handleFilesUpload],
  );

  useEffect(() => {
    document.title = "Start — Säkra";
    Promise.all([fetchDocuments(), fetchClients()])
      .then(([d, c]) => {
        setDocs(d);
        setClients(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDocs = docs.length;
  const docsWithIssues = docs.filter(
    (d) => d.compliance_status === "red" || d.compliance_status === "yellow",
  ).length;
  const greenDocs = docs.filter((d) => d.compliance_status === "green").length;
  const reviewedDocs = docs.filter((d) => d.compliance_status).length;
  const complianceRate =
    reviewedDocs > 0 ? Math.round((greenDocs / reviewedDocs) * 100) : 0;

  const statCards = [
    {
      label: "Att hantera",
      value: docsWithIssues,
      sub: docsWithIssues > 0 ? "Dokument med avvikelser" : "Inga öppna ärenden",
      icon: Inbox,
      color: docsWithIssues > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50",
      path: "/inbox",
    },
    {
      label: "Dokument totalt",
      value: totalDocs,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
      path: "/archive",
    },
    {
      label: "Godkända",
      value: greenDocs,
      sub: reviewedDocs > 0 ? `${complianceRate}% godkända` : undefined,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
      path: "/archive",
    },
    {
      label: "Klienter",
      value: clients.length,
      icon: Users,
      color: "text-teal-600 bg-teal-50",
      path: "/clients",
    },
  ];


  if (chatActive) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader title="Start" />
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="grid flex-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Card
                key={card.label}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => navigate(card.path)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <card.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="font-brand text-lg leading-tight tracking-tight">
                      {loading ? "—" : card.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <AdvisorChat expanded />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Start" />
      <div className="space-y-6 p-6">
        <div className="py-4">
          <h1 className="font-brand text-2xl tracking-tight">
            Välkommen tillbaka{displayName ? `, ${displayName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Redo för nästa rådgivningsmöte?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer py-0 gap-0 transition-colors hover:bg-muted/50"
              onClick={() => navigate(card.path)}
            >
              <CardContent className="flex items-center gap-4 px-5 py-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}
                >
                  <card.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="font-brand text-2xl tracking-tight">
                    {loading ? "—" : card.value}
                  </p>
                  {card.sub && !loading && (
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Document drop zone */}
        {uploadStatus === "idle" ? (
          <label
            htmlFor="start-file-upload"
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-5 py-4 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-secondary/30"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Ladda upp dokument</p>
              <p className="text-xs text-muted-foreground">
                Dra och släpp, eller klicka för att bläddra
              </p>
            </div>
            <input
              id="start-file-upload"
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files)
                  handleFilesUpload(Array.from(e.target.files));
              }}
            />
          </label>
        ) : uploadStatus === "uploading" || uploadStatus === "processing" ? (
          <div className="flex items-center gap-3 rounded-xl border px-5 py-4">
            <Loader2 className="size-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">
                {uploadStatus === "uploading"
                  ? "Laddar upp..."
                  : "Analyserar dokument..."}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {uploadedFileNames.join(", ")}
              </p>
            </div>
          </div>
        ) : uploadStatus === "done" ? (
          <div
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 transition-colors hover:bg-emerald-100"
            onClick={() => {
              if (uploadedDocIds.length === 1)
                navigate(`/documents/${uploadedDocIds[0]}`);
              else navigate("/archive");
            }}
          >
            <CheckCircle2 className="size-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">
                {uploadedFileNames.length === 1
                  ? "Dokument uppladdat och analyserat"
                  : `${uploadedFileNames.length} dokument uppladdade`}
              </p>
            </div>
            <span className="text-sm font-medium text-emerald-700">
              Visa →
            </span>
          </div>
        ) : uploadStatus === "error" ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Uppladdning misslyckades
              </p>
            </div>
            <button
              className="text-sm font-medium text-red-700 hover:text-red-900"
              onClick={() => setUploadStatus("idle")}
            >
              Försök igen
            </button>
          </div>
        ) : null}

        <div>
          <h2 className="mb-3 font-brand text-sm font-medium text-muted-foreground">
            AI Assistent
          </h2>
          <AdvisorChat />
        </div>
      </div>
    </>
  );
}

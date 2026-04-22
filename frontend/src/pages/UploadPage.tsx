import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { uploadDocuments, processDocumentsSSE } from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/language";
import type { ProcessEvent } from "@/types";

type Step = "select" | "processing" | "results";

interface FileState {
  file: File;
  docId?: number;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  message?: string;
  documentType?: string;
  clientName?: string;
}

const translations = {
  sv: {
    pageTitle: "Ladda upp dokument — Säkra",
    headerTitle: "Ladda upp dokument",
    uploadHeadline: "Ladda upp rådgivningsdokument",
    uploadHint: "Dra och släpp filer, eller klicka för att bläddra",
    pdfLimit: "PDF — upp till 50 MB",
    fileSelectedSingular: "fil vald",
    fileSelectedPlural: "filer valda",
    uploadBtnSingular: "fil",
    uploadBtnPlural: "filer",
    uploadAction: "Ladda upp",
    uploading: "Laddar upp...",
    waitingAnalysis: "Väntar på analys...",
    uploadFailed: "Uppladdning misslyckades",
    processingProgress: "Bearbetar",
    processingOf: "av",
    processingDocs: "dokument...",
    processingDone: "Bearbetning klar",
    view: "Visa",
    showAll: "Visa alla dokument",
    uploadMore: "Ladda upp fler",
    docTypeInvestment: "Investeringsrådgivning",
    docTypePension: "Pensionsflytt",
    docTypeInsurance: "Försäkringsrådgivning",
    docTypeSuitability: "Lämplighetsbedömning",
    docTypeUnknown: "Okänd",
  },
  en: {
    pageTitle: "Upload documents — Säkra",
    headerTitle: "Upload documents",
    uploadHeadline: "Upload advisory documents",
    uploadHint: "Drag and drop files, or click to browse",
    pdfLimit: "PDF — up to 50 MB",
    fileSelectedSingular: "file selected",
    fileSelectedPlural: "files selected",
    uploadBtnSingular: "file",
    uploadBtnPlural: "files",
    uploadAction: "Upload",
    uploading: "Uploading…",
    waitingAnalysis: "Waiting for analysis…",
    uploadFailed: "Upload failed",
    processingProgress: "Processing",
    processingOf: "of",
    processingDocs: "documents…",
    processingDone: "Processing complete",
    view: "View",
    showAll: "Show all documents",
    uploadMore: "Upload more",
    docTypeInvestment: "Investment advice",
    docTypePension: "Pension transfer",
    docTypeInsurance: "Insurance advice",
    docTypeSuitability: "Suitability assessment",
    docTypeUnknown: "Unknown",
  },
} satisfies Record<Lang, Record<string, string>>;

type T = typeof translations["sv"];

function getDocTypeLabels(t: T): Record<string, string> {
  return {
    investment_advice: t.docTypeInvestment,
    pension_transfer: t.docTypePension,
    insurance_advice: t.docTypeInsurance,
    suitability_assessment: t.docTypeSuitability,
    unknown: t.docTypeUnknown,
  };
}

export function UploadPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const DOC_TYPE_LABELS = getDocTypeLabels(t);
  const [step, setStep] = useState<Step>("select");
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const added = Array.from(newFiles).map((file) => ({
      file,
      status: "pending" as const,
    }));
    setFileStates((prev) => [...prev, ...added]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFileStates((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const completedCount = fileStates.filter(
    (f) => f.status === "completed" || f.status === "failed",
  ).length;
  const totalCount = fileStates.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const startUpload = async () => {
    setStep("processing");

    // Mark all as uploading
    setFileStates((prev) =>
      prev.map((f) => ({ ...f, status: "uploading" as const, message: t.uploading })),
    );

    try {
      const result = await uploadDocuments(fileStates.map((f) => f.file));

      // Map IDs to file states
      const idMap = new Map<number, number>(); // docId → fileIndex
      setFileStates((prev) =>
        prev.map((f, i) => {
          const uploaded = result.documents[i];
          if (uploaded) {
            idMap.set(uploaded.id, i);
            return { ...f, docId: uploaded.id, status: "processing" as const, message: t.waitingAnalysis };
          }
          return f;
        }),
      );

      const docIds = result.documents.map((d) => d.id);

      processDocumentsSSE(
        docIds,
        (event: ProcessEvent) => {
          if (event.status === "all_done") return;
          if (!event.id) return;
          setFileStates((prev) =>
            prev.map((f) => {
              if (f.docId !== event.id) return f;
              return {
                ...f,
                status: event.status as FileState["status"],
                message: event.message,
                documentType: event.document_type || f.documentType,
                clientName: event.client_name || f.clientName,
              };
            }),
          );
        },
        () => {
          setStep("results");
        },
        (err) => {
          console.error("SSE error:", err);
          setStep("results");
        },
      );
    } catch (err) {
      console.error("Upload error:", err);
      setFileStates((prev) =>
        prev.map((f) => ({ ...f, status: "failed" as const, message: t.uploadFailed })),
      );
      setStep("results");
    }
  };

  const reset = () => {
    setStep("select");
    setFileStates([]);
  };

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6">
        {step === "select" && (
          <Card>
            <CardContent className="p-8">
              <label
                htmlFor="file-upload"
                className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/30"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {t.uploadHeadline}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.uploadHint}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.pdfLimit}
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>

              {fileStates.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {fileStates.length}{" "}
                    {fileStates.length === 1 ? t.fileSelectedSingular : t.fileSelectedPlural}
                  </p>
                  {fileStates.map((fs, i) => (
                    <div
                      key={`${fs.file.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border bg-secondary/30 px-4 py-2.5"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">
                        {fs.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(fs.file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeFile(i);
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  <Button onClick={startUpload} className="mt-4 w-full">
                    <Upload className="mr-2 size-4" />
                    {t.uploadAction} {fileStates.length}{" "}
                    {fileStates.length === 1 ? t.uploadBtnSingular : t.uploadBtnPlural}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "processing" && (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium">
                  {t.processingProgress} {completedCount} {t.processingOf} {totalCount} {t.processingDocs}
                </p>
                <Progress value={progressPercent} />
              </div>

              <div className="space-y-3">
                {fileStates.map((fs, i) => (
                  <div
                    key={`${fs.file.name}-${i}`}
                    className="flex items-center gap-3 rounded-lg border px-4 py-3"
                  >
                    <StatusIcon status={fs.status} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {fs.file.name}
                      </p>
                      {fs.message && (
                        <p className="truncate text-xs text-muted-foreground">
                          {fs.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "results" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  {t.processingDone}
                </h2>
                <div className="space-y-3">
                  {fileStates.map((fs, i) => (
                    <div
                      key={`${fs.file.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border px-4 py-3"
                    >
                      <StatusIcon status={fs.status} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {fs.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {fs.documentType && (
                            <Badge variant="secondary" className="text-xs">
                              {DOC_TYPE_LABELS[fs.documentType] || fs.documentType}
                            </Badge>
                          )}
                          {fs.clientName && (
                            <span className="text-xs text-muted-foreground">
                              {fs.clientName}
                            </span>
                          )}
                        </div>
                      </div>
                      {fs.status === "completed" && fs.docId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/documents/${fs.docId}`)}
                        >
                          {t.view}
                          <ArrowRight className="ml-1 size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => navigate("/documents")}>
                {t.showAll}
              </Button>
              <Button variant="outline" onClick={reset}>
                {t.uploadMore}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatusIcon({ status }: { status: FileState["status"] }) {
  switch (status) {
    case "pending":
      return <FileText className="size-4 text-muted-foreground" />;
    case "uploading":
    case "processing":
      return <Loader2 className="size-4 animate-spin text-primary" />;
    case "completed":
      return <CheckCircle2 className="size-4 text-green-600" />;
    case "failed":
      return <XCircle className="size-4 text-destructive" />;
  }
}

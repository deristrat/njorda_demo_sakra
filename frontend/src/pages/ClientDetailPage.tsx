import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import {
  fetchClient,
  fetchClientDocuments,
  uploadDocuments,
  processDocumentsSSE,
} from "@/lib/api";
import { SendCommentDialog } from "@/components/notifications/SendCommentDialog";
import { useAuth } from "@/lib/auth";
import { useLanguage, type Lang } from "@/lib/language";
import type { ClientDetail, DocumentSummary, ProcessEvent } from "@/types";
import { toast } from "sonner";

const translations = {
  sv: {
    headerClient: "Klient",
    clientFallback: "Klient",
    somethingWentWrong: "Något gick fel",
    clientNotFound: "Klienten hittades inte.",
    back: "Tillbaka",
    regardingClient: "Angående klient",
    clientInfo: "Klientinformation",
    name: "Namn",
    personNumber: "Personnummer",
    address: "Adress",
    email: "E-post",
    phone: "Telefon",
    documents: "Dokument",
    uploadDocument: "Ladda upp dokument",
  },
  en: {
    headerClient: "Client",
    clientFallback: "Client",
    somethingWentWrong: "Something went wrong",
    clientNotFound: "Client not found.",
    back: "Back",
    regardingClient: "Regarding client",
    clientInfo: "Client information",
    name: "Name",
    personNumber: "Personal number",
    address: "Address",
    email: "Email",
    phone: "Phone",
    documents: "Documents",
    uploadDocument: "Upload document",
  },
} satisfies Record<Lang, Record<string, string>>;

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { effectiveRole } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientId = Number(id);

  const loadDocs = useCallback(() => {
    setDocsLoading(true);
    fetchClientDocuments(clientId)
      .then(setDocs)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setDocsLoading(false));
  }, [clientId, t.somethingWentWrong]);

  useEffect(() => {
    if (!id) return;
    fetchClient(clientId)
      .then(setClient)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
    loadDocs();
  }, [id, clientId, loadDocs, t.somethingWentWrong]);

  useEffect(() => {
    if (client) {
      document.title = `${client.person_name || t.clientFallback} — Säkra`;
    }
  }, [client, t.clientFallback]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const result = await uploadDocuments(Array.from(files), clientId);
      const docIds = result.documents.map((d) => d.id);

      processDocumentsSSE(
        docIds,
        (event: ProcessEvent) => {
          if (event.status === "all_done") return;
        },
        () => {
          setUploading(false);
          loadDocs();
        },
        () => {
          setUploading(false);
          loadDocs();
        },
      );
    } catch {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title={t.headerClient} />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <AppHeader title={t.headerClient} />
        <div className="p-6">
          <p className="text-muted-foreground">{t.clientNotFound}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={client.person_name || t.clientFallback} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/clients")}>
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
          {effectiveRole !== "advisor" && docs.some((d) => d.advisor_id) && (
            <div className="ml-auto">
              <SendCommentDialog
                clientId={clientId}
                advisorId={docs.find((d) => d.advisor_id)?.advisor_id}
                advisorName={docs.find((d) => d.advisor_name)?.advisor_name}
                defaultSubject={`${t.regardingClient}: ${client.person_name || client.person_number}`}
              />
            </div>
          )}
        </div>

        {/* Client info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.clientInfo}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{t.name}</dt>
                <dd className="text-sm font-medium">
                  {client.person_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.personNumber}</dt>
                <dd className="text-sm font-medium font-brand">
                  {client.person_number}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.address}</dt>
                <dd className="text-sm font-medium">
                  {client.address || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.email}</dt>
                <dd className="text-sm font-medium">
                  {client.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.phone}</dt>
                <dd className="text-sm font-medium">
                  {client.phone || "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Documents section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t.documents}</h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-1 size-4" />
                )}
                {t.uploadDocument}
              </Button>
            </div>
          </div>
          <DocumentsTable
            externalData={docs}
            externalLoading={docsLoading}
            onRefresh={loadDocs}
          />
        </div>
      </div>
    </>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { fetchAdvisor, fetchAdvisorDocuments } from "@/lib/api";
import { SendCommentDialog } from "@/components/notifications/SendCommentDialog";
import { useAuth } from "@/lib/auth";
import { useLanguage, type Lang } from "@/lib/language";
import type { AdvisorDetail, DocumentSummary } from "@/types";
import { toast } from "sonner";

const translations = {
  sv: {
    headerAdvisor: "Rådgivare",
    somethingWentWrong: "Något gick fel",
    advisorNotFound: "Rådgivaren hittades inte.",
    back: "Tillbaka",
    regardingAdvisor: "Angående rådgivare",
    advisorInfo: "Rådgivarinformation",
    name: "Namn",
    firm: "Företag",
    license: "Licens",
    documents: "Dokument",
  },
  en: {
    headerAdvisor: "Advisor",
    somethingWentWrong: "Something went wrong",
    advisorNotFound: "Advisor not found.",
    back: "Back",
    regardingAdvisor: "Regarding advisor",
    advisorInfo: "Advisor information",
    name: "Name",
    firm: "Firm",
    license: "License",
    documents: "Documents",
  },
} satisfies Record<Lang, Record<string, string>>;

export function AdvisorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { effectiveRole } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [advisor, setAdvisor] = useState<AdvisorDetail | null>(null);
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);

  const advisorId = Number(id);

  const loadDocs = useCallback(() => {
    setDocsLoading(true);
    fetchAdvisorDocuments(advisorId)
      .then(setDocs)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setDocsLoading(false));
  }, [advisorId, t.somethingWentWrong]);

  useEffect(() => {
    if (!id) return;
    fetchAdvisor(advisorId)
      .then(setAdvisor)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
    loadDocs();
  }, [id, advisorId, loadDocs, t.somethingWentWrong]);

  useEffect(() => {
    if (advisor) {
      document.title = `${advisor.advisor_name} — Säkra`;
    }
  }, [advisor]);

  if (loading) {
    return (
      <>
        <AppHeader title={t.headerAdvisor} />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!advisor) {
    return (
      <>
        <AppHeader title={t.headerAdvisor} />
        <div className="p-6">
          <p className="text-muted-foreground">{t.advisorNotFound}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={advisor.advisor_name} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/advisors")}>
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
          {effectiveRole !== "advisor" && (
            <div className="ml-auto">
              <SendCommentDialog
                advisorId={advisorId}
                advisorName={advisor.advisor_name}
                defaultSubject={`${t.regardingAdvisor}: ${advisor.advisor_name}`}
              />
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.advisorInfo}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{t.name}</dt>
                <dd className="text-sm font-medium">
                  {advisor.advisor_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.firm}</dt>
                <dd className="text-sm font-medium">
                  {advisor.firm_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.license}</dt>
                <dd className="text-sm font-medium">
                  {advisor.license_number || "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-base font-semibold">{t.documents}</h2>
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

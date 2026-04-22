import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDocument, getDocumentFileUrl } from "@/lib/api";
import { formatDate, formatSEK } from "@/lib/utils";
import { toast } from "sonner";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
import { SendCommentDialog } from "@/components/notifications/SendCommentDialog";
import { useAuth } from "@/lib/auth";
import { useLanguage, type Lang } from "@/lib/language";
import type { DocumentDetail, ExtractionData } from "@/types";

const translations = {
  sv: {
    headerTitleFallback: "Dokument",
    somethingWrong: "Något gick fel",
    notFound: "Dokumentet hittades inte.",
    back: "Tillbaka",
    viewPdf: "Visa PDF",
    hidePdf: "Dölj PDF",
    showSideBySide: "Visa bredvid",
    pdfPreviewTitle: "PDF-förhandsgranskning",
    docInfo: "Dokumentinformation",
    type: "Typ",
    date: "Datum",
    pages: "Sidor",
    fileSize: "Filstorlek",
    clientInfo: "Klientinformation",
    name: "Namn",
    personNumber: "Personnummer",
    address: "Adress",
    email: "E-post",
    phone: "Telefon",
    advisor: "Rådgivare",
    company: "Företag",
    license: "Licens",
    suitability: "Lämplighetsbedömning",
    riskProfile: "Riskprofil",
    investmentHorizon: "Placeringshorisont",
    experience: "Erfarenhet",
    investmentObjective: "Placeringsmål",
    lossTolerance: "Förlusttolerans",
    financialSituation: "Ekonomisk situation",
    recommendations: "Rekommendationer",
    product: "Produkt",
    amount: "Belopp",
    share: "Andel",
    motivation: "Motivering",
    pensionTransfer: "Pensionsflytt",
    from: "Från",
    to: "Till",
    extractionNotes: "Extraktionsnoteringar",
    compliance: "Regelefterlevnad",
    docTypeInvestment: "Investeringsrådgivning",
    docTypePension: "Pensionsflytt",
    docTypeInsurance: "Försäkringsrådgivning",
    docTypeSuitability: "Lämplighetsbedömning",
    docTypeUnknown: "Okänd",
    riskVeryLow: "Mycket låg",
    riskLow: "Låg",
    riskMedium: "Medel",
    riskMediumHigh: "Medel-hög",
    riskHigh: "Hög",
    riskVeryHigh: "Mycket hög",
    expNone: "Ingen",
    expLimited: "Begränsad",
    expModerate: "Måttlig",
    expExtensive: "Omfattande",
    statusUploaded: "Uppladdad",
    statusProcessing: "Bearbetar",
    statusCompleted: "Klar",
    statusFailed: "Misslyckades",
  },
  en: {
    headerTitleFallback: "Document",
    somethingWrong: "Something went wrong",
    notFound: "Document not found.",
    back: "Back",
    viewPdf: "View PDF",
    hidePdf: "Hide PDF",
    showSideBySide: "Show side by side",
    pdfPreviewTitle: "PDF preview",
    docInfo: "Document information",
    type: "Type",
    date: "Date",
    pages: "Pages",
    fileSize: "File size",
    clientInfo: "Client information",
    name: "Name",
    personNumber: "Personal ID",
    address: "Address",
    email: "Email",
    phone: "Phone",
    advisor: "Advisor",
    company: "Company",
    license: "License",
    suitability: "Suitability assessment",
    riskProfile: "Risk profile",
    investmentHorizon: "Investment horizon",
    experience: "Experience",
    investmentObjective: "Investment objective",
    lossTolerance: "Loss tolerance",
    financialSituation: "Financial situation",
    recommendations: "Recommendations",
    product: "Product",
    amount: "Amount",
    share: "Share",
    motivation: "Motivation",
    pensionTransfer: "Pension transfer",
    from: "From",
    to: "To",
    extractionNotes: "Extraction notes",
    compliance: "Compliance",
    docTypeInvestment: "Investment advice",
    docTypePension: "Pension transfer",
    docTypeInsurance: "Insurance advice",
    docTypeSuitability: "Suitability assessment",
    docTypeUnknown: "Unknown",
    riskVeryLow: "Very low",
    riskLow: "Low",
    riskMedium: "Medium",
    riskMediumHigh: "Medium-high",
    riskHigh: "High",
    riskVeryHigh: "Very high",
    expNone: "None",
    expLimited: "Limited",
    expModerate: "Moderate",
    expExtensive: "Extensive",
    statusUploaded: "Uploaded",
    statusProcessing: "Processing",
    statusCompleted: "Completed",
    statusFailed: "Failed",
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

function getRiskLabels(t: T): Record<string, string> {
  return {
    very_low: t.riskVeryLow,
    low: t.riskLow,
    medium: t.riskMedium,
    medium_high: t.riskMediumHigh,
    high: t.riskHigh,
    very_high: t.riskVeryHigh,
  };
}

function getExperienceLabels(t: T): Record<string, string> {
  return {
    none: t.expNone,
    limited: t.expLimited,
    moderate: t.expModerate,
    extensive: t.expExtensive,
  };
}

function getStatusLabels(t: T): Record<string, string> {
  return {
    uploaded: t.statusUploaded,
    processing: t.statusProcessing,
    completed: t.statusCompleted,
    failed: t.statusFailed,
  };
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { effectiveRole } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const DOC_TYPE_LABELS = getDocTypeLabels(t);
  const RISK_LABELS = getRiskLabels(t);
  const EXPERIENCE_LABELS = getExperienceLabels(t);
  const STATUS_LABELS = getStatusLabels(t);
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPdfPane, setShowPdfPane] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchDocument(Number(id))
      .then(setDoc)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWrong))
      .finally(() => setLoading(false));
  }, [id, t.somethingWrong]);

  useEffect(() => {
    if (doc) {
      document.title = `${doc.original_filename} — Säkra`;
    }
  }, [doc]);

  if (loading) {
    return (
      <>
        <AppHeader title={t.headerTitleFallback} />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!doc) {
    return (
      <>
        <AppHeader title={t.headerTitleFallback} />
        <div className="p-6">
          <p className="text-muted-foreground">{t.notFound}</p>
        </div>
      </>
    );
  }

  const latestExtraction = doc.extractions.length > 0 ? doc.extractions[0] : null;
  const data: ExtractionData | null = latestExtraction?.extraction_data ?? null;
  const statusVariant =
    doc.status === "completed"
      ? "default"
      : doc.status === "failed"
        ? "destructive"
        : "secondary";

  return (
    <>
      <AppHeader title={doc.original_filename} />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/documents")}>
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
          <Badge variant={statusVariant}>
            {STATUS_LABELS[doc.status] || doc.status}
          </Badge>
          <div className="ml-auto flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-none border-r-0"
              onClick={() => window.open(getDocumentFileUrl(doc.id), "_blank")}
            >
              <ExternalLink className="mr-1 size-4" />
              {t.viewPdf}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-l-none px-2">
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPdfPane((v) => !v)}>
                  {showPdfPane ? (
                    <>
                      <PanelRightClose className="mr-2 size-4" />
                      {t.hidePdf}
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="mr-2 size-4" />
                      {t.showSideBySide}
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {effectiveRole !== "advisor" && doc.status === "completed" && (
              <SendCommentDialog
                documentId={doc.id}
                documentFilename={doc.original_filename}
                clientId={doc.client_id}
                advisorId={doc.advisor_id}
                advisorName={data?.advisor?.advisor_name}
              />
            )}
          </div>
        </div>

        <div className={showPdfPane ? "flex gap-6" : ""}>
        <div className={showPdfPane ? "min-w-0 flex-1 space-y-6" : "space-y-6"}>
        {/* Dokumentinformation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.docInfo}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">{t.type}</dt>
                <dd className="text-sm font-medium">
                  {data?.document_type
                    ? DOC_TYPE_LABELS[data.document_type] || data.document_type
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.date}</dt>
                <dd className="text-sm font-medium">
                  {data?.document_date ? formatDate(data.document_date) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.pages}</dt>
                <dd className="text-sm font-medium">
                  {data?.page_count ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.fileSize}</dt>
                <dd className="text-sm font-medium">
                  {(doc.file_size / 1024).toFixed(0)} KB
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Klientinformation */}
        {data?.client && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.clientInfo}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.name}</dt>
                  <dd className="text-sm font-medium">
                    {doc.client_id ? (
                      <a
                        href={`/clients/${doc.client_id}`}
                        className="text-primary hover:underline"
                      >
                        {data.client.person_name || "—"}
                      </a>
                    ) : (
                      data.client.person_name || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.personNumber}</dt>
                  <dd className="text-sm font-medium font-brand">{data.client.person_number || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.address}</dt>
                  <dd className="text-sm font-medium">{data.client.address || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.email}</dt>
                  <dd className="text-sm font-medium">{data.client.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.phone}</dt>
                  <dd className="text-sm font-medium">{data.client.phone || "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Rådgivare */}
        {data?.advisor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.advisor}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.name}</dt>
                  <dd className="text-sm font-medium">
                    {doc.advisor_id ? (
                      <a
                        href={`/advisors/${doc.advisor_id}`}
                        className="text-primary hover:underline"
                      >
                        {data.advisor.advisor_name || "—"}
                      </a>
                    ) : (
                      data.advisor.advisor_name || "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.company}</dt>
                  <dd className="text-sm font-medium">{data.advisor.firm_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.license}</dt>
                  <dd className="text-sm font-medium">{data.advisor.license_number || "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Lämplighetsbedömning */}
        {data?.suitability && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.suitability}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.riskProfile}</dt>
                  <dd className="text-sm font-medium">
                    {data.suitability.risk_profile
                      ? RISK_LABELS[data.suitability.risk_profile] || data.suitability.risk_profile
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.investmentHorizon}</dt>
                  <dd className="text-sm font-medium">{data.suitability.investment_horizon || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.experience}</dt>
                  <dd className="text-sm font-medium">
                    {data.suitability.experience_level
                      ? EXPERIENCE_LABELS[data.suitability.experience_level] || data.suitability.experience_level
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.investmentObjective}</dt>
                  <dd className="text-sm font-medium">{data.suitability.investment_objective || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.lossTolerance}</dt>
                  <dd className="text-sm font-medium">{data.suitability.loss_tolerance || "—"}</dd>
                </div>
                {data.suitability.financial_situation && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs text-muted-foreground">{t.financialSituation}</dt>
                    <dd className="text-sm font-medium">{data.suitability.financial_situation}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Rekommendationer */}
        {data?.recommendations && data.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.recommendations}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.product}</TableHead>
                      <TableHead>ISIN</TableHead>
                      <TableHead className="text-right">{t.amount}</TableHead>
                      <TableHead className="text-right">{t.share}</TableHead>
                      <TableHead>{t.motivation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recommendations.map((rec, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {rec.product_name || "—"}
                        </TableCell>
                        <TableCell className="font-brand text-xs">
                          {rec.isin || "—"}
                        </TableCell>
                        <TableCell className="text-right font-brand text-sm">
                          {rec.amount != null ? formatSEK(rec.amount) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-brand text-sm">
                          {rec.percentage != null ? `${rec.percentage}%` : "—"}
                        </TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground">
                          {rec.motivation || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pensionsflytt */}
        {(data?.pension_provider_from || data?.pension_provider_to) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.pensionTransfer}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.from}</dt>
                  <dd className="text-sm font-medium">{data.pension_provider_from || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.to}</dt>
                  <dd className="text-sm font-medium">{data.pension_provider_to || "—"}</dd>
                </div>
                {data.transfer_amount != null && (
                  <div>
                    <dt className="text-xs text-muted-foreground">{t.amount}</dt>
                    <dd className="text-sm font-medium font-brand">{formatSEK(data.transfer_amount)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Extraktionsnoteringar */}
        {data?.confidence_notes && data.confidence_notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.extractionNotes}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {data.confidence_notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Regelefterlevnad */}
        {doc.status === "completed" && (
          <CompliancePanel documentId={doc.id} />
        )}
        </div>

        {showPdfPane && (
          <div className="w-[45%] shrink-0 sticky top-6 self-start">
            <iframe
              src={getDocumentFileUrl(doc.id)}
              className="h-[calc(100vh-10rem)] w-full rounded-lg border"
              title={t.pdfPreviewTitle}
            />
          </div>
        )}
        </div>
      </div>
    </>
  );
}

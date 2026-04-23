import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/AppHeader";
import { fetchComplianceReport } from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/language";
import { toast } from "sonner";
import type {
  ComplianceReportRunDetail,
  CriticalItem,
  AdvisorBreakdown,
} from "@/types";

const STATUS_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

const translations = {
  sv: {
    pageTitle: "Compliance rapport — Säkra",
    headerTitle: "Compliance rapport",
    back: "Tillbaka",
    backToReports: "Tillbaka till rapporter",
    notFound: "Rapporten hittades inte eller saknar data.",
    somethingWentWrong: "Något gick fel",
    kpiAverageScore: "Snittpoäng",
    kpiTotalDocuments: "Totalt dokument",
    kpiGreen: "Gröna",
    kpiGreenSub: "Godkända",
    kpiYellowRed: "Gula / Röda",
    kpiYellowRedSub: "Varning / Underkända",
    kpiComplianceRate: "Compliance-grad",
    criticalIssuesTitle: "Kritiska avvikelser",
    noCriticalIssues: "Inga kritiska avvikelser hittades.",
    mostFailedRulesTitle: "Vanligast brutna regler",
    noFailedRules: "Inga regelöverträdelser registrerade.",
    perAdvisorTitle: "Per rådgivare",
    noAdvisorData: "Ingen rådgivardata tillgänglig.",
    docTypeCoverageTitle: "Dokumenttypstäckning",
    noCoverageData: "Ingen data tillgänglig.",
    colDocument: "Dokument",
    colClient: "Klient",
    colAdvisor: "Rådgivare",
    colScore: "Poäng",
    colFailedRules: "Brutna regler",
    colStatus: "Status",
    docs: "dok",
    violations: "brott",
    allApproved: "Alla dokument godkända.",
    averageScorePrefix: "Snittpoäng:",
    statusGreen: "Godkänd",
    statusYellow: "Varning",
    statusRed: "Underkänd",
    docTypes: {
      investment_advice: "Placeringsrådgivning",
      pension_transfer: "Pensionsflytt",
      suitability_assessment: "Lämplighetsbedömning",
      insurance_advice: "Försäkringsrådgivning",
      unknown: "Okänd",
    },
  },
  en: {
    pageTitle: "Compliance report — Säkra",
    headerTitle: "Compliance report",
    back: "Back",
    backToReports: "Back to reports",
    notFound: "Report not found or missing data.",
    somethingWentWrong: "Something went wrong",
    kpiAverageScore: "Average score",
    kpiTotalDocuments: "Total documents",
    kpiGreen: "Green",
    kpiGreenSub: "Approved",
    kpiYellowRed: "Yellow / Red",
    kpiYellowRedSub: "Warning / Rejected",
    kpiComplianceRate: "Compliance rate",
    criticalIssuesTitle: "Critical issues",
    noCriticalIssues: "No critical issues found.",
    mostFailedRulesTitle: "Most broken rules",
    noFailedRules: "No rule violations recorded.",
    perAdvisorTitle: "Per advisor",
    noAdvisorData: "No advisor data available.",
    docTypeCoverageTitle: "Document type coverage",
    noCoverageData: "No data available.",
    colDocument: "Document",
    colClient: "Client",
    colAdvisor: "Advisor",
    colScore: "Score",
    colFailedRules: "Broken rules",
    colStatus: "Status",
    docs: "docs",
    violations: "violations",
    allApproved: "All documents approved.",
    averageScorePrefix: "Average score:",
    statusGreen: "Approved",
    statusYellow: "Warning",
    statusRed: "Rejected",
    docTypes: {
      investment_advice: "Investment advice",
      pension_transfer: "Pension transfer",
      suitability_assessment: "Suitability assessment",
      insurance_advice: "Insurance advice",
      unknown: "Unknown",
    },
  },
} satisfies Record<Lang, {
  pageTitle: string;
  headerTitle: string;
  back: string;
  backToReports: string;
  notFound: string;
  somethingWentWrong: string;
  kpiAverageScore: string;
  kpiTotalDocuments: string;
  kpiGreen: string;
  kpiGreenSub: string;
  kpiYellowRed: string;
  kpiYellowRedSub: string;
  kpiComplianceRate: string;
  criticalIssuesTitle: string;
  noCriticalIssues: string;
  mostFailedRulesTitle: string;
  noFailedRules: string;
  perAdvisorTitle: string;
  noAdvisorData: string;
  docTypeCoverageTitle: string;
  noCoverageData: string;
  colDocument: string;
  colClient: string;
  colAdvisor: string;
  colScore: string;
  colFailedRules: string;
  colStatus: string;
  docs: string;
  violations: string;
  allApproved: string;
  averageScorePrefix: string;
  statusGreen: string;
  statusYellow: string;
  statusRed: string;
  docTypes: Record<string, string>;
}>;

type T = typeof translations["sv"];

function StatusBadge({ status, t }: { status: string; t: T }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-800",
    yellow: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    green: t.statusGreen,
    yellow: t.statusYellow,
    red: t.statusRed,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {labels[status] || status}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-1 font-brand text-xl font-semibold tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function DocLink({ docId, children }: { docId: number; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="text-left underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/documents/${docId}`);
      }}
    >
      {children}
    </button>
  );
}

function CriticalItemsSection({ items, t }: { items: CriticalItem[]; t: T }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t.noCriticalIssues}
      </p>
    );
  }
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.colDocument}</TableHead>
            <TableHead>{t.colClient}</TableHead>
            <TableHead>{t.colAdvisor}</TableHead>
            <TableHead>{t.colScore}</TableHead>
            <TableHead>{t.colFailedRules}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.document_id}>
              <TableCell className="max-w-[200px] truncate text-sm">
                <DocLink docId={item.document_id}>{item.filename}</DocLink>
              </TableCell>
              <TableCell className="text-sm">
                {item.client_name || "—"}
              </TableCell>
              <TableCell className="text-sm">
                {item.advisor_name || "—"}
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm text-red-600">
                  {item.score}%
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.failed_rules.map((fr) => (
                    <Badge
                      key={fr.rule_id}
                      variant="destructive"
                      className="font-normal text-xs"
                    >
                      {fr.rule_name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface RuleDoc {
  document_id: number;
  filename: string;
  client_name: string | null;
  score: number;
  status: string;
}

/** Build a map of rule_id → documents that violate it, from advisor breakdown data. */
function buildRuleDocsMap(advisors: AdvisorBreakdown[]): Record<string, RuleDoc[]> {
  const map: Record<string, RuleDoc[]> = {};
  for (const advisor of advisors) {
    for (const doc of advisor.documents) {
      for (const fr of doc.failed_rules) {
        if (!map[fr.rule_id]) map[fr.rule_id] = [];
        map[fr.rule_id].push({
          document_id: doc.document_id,
          filename: doc.filename,
          client_name: doc.client_name,
          score: doc.score,
          status: doc.status,
        });
      }
    }
  }
  return map;
}

function FailedRuleCard({
  rule,
  docs,
  t,
}: {
  rule: { rule_id: string; rule_name: string; fail_count: number; category: string };
  docs: RuleDoc[];
  t: T;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {open ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <CardTitle className="text-base">{rule.rule_name}</CardTitle>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="font-normal">
                  {rule.category}
                </Badge>
                <span className="font-mono">{rule.fail_count} {t.violations}</span>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.colDocument}</TableHead>
                  <TableHead>{t.colClient}</TableHead>
                  <TableHead>{t.colScore}</TableHead>
                  <TableHead>{t.colStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.document_id}>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      <DocLink docId={doc.document_id}>{doc.filename}</DocLink>
                    </TableCell>
                    <TableCell className="text-sm">
                      {doc.client_name || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {doc.score}%
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} t={t} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function MostFailedRulesSection({
  rules,
  ruleDocsMap,
  t,
}: {
  rules: Array<{
    rule_id: string;
    rule_name: string;
    fail_count: number;
    category: string;
  }>;
  ruleDocsMap: Record<string, RuleDoc[]>;
  t: T;
}) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t.noFailedRules}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {rules.map((r) => (
        <FailedRuleCard
          key={r.rule_id}
          rule={r}
          docs={ruleDocsMap[r.rule_id] || []}
          t={t}
        />
      ))}
    </div>
  );
}

function AdvisorCard({ advisor, t }: { advisor: AdvisorBreakdown; t: T }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {open ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <CardTitle className="text-base">{advisor.advisor_name}</CardTitle>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{advisor.document_count} {t.docs}</span>
                <span className="font-mono">{advisor.average_score}%</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className={`inline-block size-2 rounded-full ${STATUS_COLORS.green}`} />
                    {advisor.green}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`inline-block size-2 rounded-full ${STATUS_COLORS.yellow}`} />
                    {advisor.yellow}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`inline-block size-2 rounded-full ${STATUS_COLORS.red}`} />
                    {advisor.red}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {advisor.documents.filter((d) => d.status !== "green").length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.colDocument}</TableHead>
                    <TableHead>{t.colClient}</TableHead>
                    <TableHead>{t.colScore}</TableHead>
                    <TableHead>{t.colStatus}</TableHead>
                    <TableHead>{t.colFailedRules}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisor.documents
                    .filter((d) => d.status !== "green")
                    .map((doc) => (
                      <TableRow key={doc.document_id}>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          <DocLink docId={doc.document_id}>{doc.filename}</DocLink>
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.client_name || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {doc.score}%
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={doc.status} t={t} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {doc.failed_rules.map((fr) => (
                              <Badge
                                key={fr.rule_id}
                                variant="outline"
                                className="font-normal text-xs"
                              >
                                {fr.rule_name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.allApproved}
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DocTypeCoverageSection({
  coverage,
  t,
}: {
  coverage: Record<string, { count: number; avg_score: number }>;
  t: T;
}) {
  const entries = Object.entries(coverage);
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t.noCoverageData}</p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([type, data]) => (
        <Card key={type}>
          <CardContent className="py-4">
            <p className="text-sm font-medium">
              {(t.docTypes as Record<string, string>)[type] || type}
            </p>
            <p className="font-brand text-xl">{data.count} {t.docs}</p>
            <p className="text-xs text-muted-foreground">
              {t.averageScorePrefix} {data.avg_score}%
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ComplianceReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [report, setReport] = useState<ComplianceReportRunDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    if (!id) return;
    fetchComplianceReport(Number(id))
      .then((r) => {
        setReport(r);
        document.title = `${r.title} — Säkra`;
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : t.somethingWentWrong),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <AppHeader title={t.headerTitle} />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!report || !report.report_data) {
    return (
      <>
        <AppHeader title={t.headerTitle} />
        <div className="p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/reports/compliance")}
          >
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
          <p className="mt-4 text-muted-foreground">
            {t.notFound}
          </p>
        </div>
      </>
    );
  }

  const data = report.report_data;
  const ruleDocsMap = buildRuleDocsMap(data.advisor_breakdown);

  return (
    <>
      <AppHeader title={report.title} />
      <div className="p-6 space-y-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/reports/compliance")}
        >
          <ArrowLeft className="mr-1 size-4" />
          {t.backToReports}
        </Button>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label={t.kpiAverageScore}
            value={`${data.average_score}%`}
          />
          <KpiCard
            label={t.kpiTotalDocuments}
            value={data.total_documents}
          />
          <KpiCard
            label={t.kpiGreen}
            value={data.status_distribution.green}
            sub={t.kpiGreenSub}
          />
          <KpiCard
            label={t.kpiYellowRed}
            value={`${data.status_distribution.yellow} / ${data.status_distribution.red}`}
            sub={t.kpiYellowRedSub}
          />
          <KpiCard
            label={t.kpiComplianceRate}
            value={`${data.compliance_rate}%`}
          />
        </div>

        {/* Critical items */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            <h2 className="font-brand text-lg">{t.criticalIssuesTitle}</h2>
          </div>
          <CriticalItemsSection items={data.critical_items} t={t} />
        </section>

        {/* Most failed rules */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" />
            <h2 className="font-brand text-lg">{t.mostFailedRulesTitle}</h2>
          </div>
          <MostFailedRulesSection rules={data.most_failed_rules} ruleDocsMap={ruleDocsMap} t={t} />
        </section>

        {/* Advisor breakdown */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            <h2 className="font-brand text-lg">{t.perAdvisorTitle}</h2>
          </div>
          <div className="space-y-3">
            {data.advisor_breakdown.length > 0 ? (
              data.advisor_breakdown.map((advisor) => (
                <AdvisorCard
                  key={advisor.advisor_id ?? "unknown"}
                  advisor={advisor}
                  t={t}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.noAdvisorData}
              </p>
            )}
          </div>
        </section>

        {/* Document type coverage */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-muted-foreground" />
            <h2 className="font-brand text-lg">{t.docTypeCoverageTitle}</h2>
          </div>
          <DocTypeCoverageSection coverage={data.document_type_coverage} t={t} />
        </section>
      </div>
    </>
  );
}

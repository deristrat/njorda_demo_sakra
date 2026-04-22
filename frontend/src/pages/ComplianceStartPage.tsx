import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Users,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AdvisorChat } from "@/components/chat/AdvisorChat";
import { fetchDocuments, fetchAdvisors, fetchClients } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat-context";
import { useLanguage, type Lang } from "@/lib/language";
import type { DocumentSummary, Advisor, Client } from "@/types";


const translations = {
  sv: {
    pageTitle: "Start — Säkra",
    headerTitle: "Start",
    welcomeBack: "Välkommen tillbaka",
    subtitle: "Här är en överblick över organisationens compliance-status",
    statDocs: "Dokument",
    statDocsApproved: "Dokument – godkända",
    percentOfReviewed: "av granskade",
    statDocsIssues: "Dokument – avvikelser",
    red: "röda",
    yellow: "gula",
    statAdvisors: "Rådgivare",
    statClients: "Klienter",
    withOpenCases: "med öppna ärenden",
    statCompliance: "Regelefterlevnad",
    aiAssistant: "AI Assistent",
    chatSubtitle:
      "Fråga om rådgivare, dokument eller compliance-status för hela organisationen",
    toggleLabel: "English",
  },
  en: {
    pageTitle: "Home — Säkra",
    headerTitle: "Home",
    welcomeBack: "Welcome back",
    subtitle: "Here's an overview of your organization's compliance status",
    statDocs: "Documents",
    statDocsApproved: "Documents – approved",
    percentOfReviewed: "of reviewed",
    statDocsIssues: "Documents – issues",
    red: "red",
    yellow: "yellow",
    statAdvisors: "Advisors",
    statClients: "Clients",
    withOpenCases: "with open cases",
    statCompliance: "Compliance",
    aiAssistant: "AI Assistant",
    chatSubtitle:
      "Ask about advisors, documents, or compliance status across the entire organization",
    toggleLabel: "Svenska",
  },
} satisfies Record<Lang, Record<string, string>>;

const suggestions: Record<Lang, string[]> = {
  sv: [
    "Vilka rådgivare har lägst compliance?",
    "Visa dokument med allvarliga avvikelser",
    "Ge en överblick över compliance-läget",
  ],
  en: [
    "Which advisors have the lowest compliance?",
    "Show documents with serious issues",
    "Give an overview of the compliance status",
  ],
};

export function ComplianceStartPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const localizedSuggestions = suggestions[lang];
  const { name, isImpersonating, impersonatingAs } = useAuth();
  const displayName = isImpersonating && impersonatingAs
    ? impersonatingAs.name
    : name;
  const { messages } = useChat();
  const chatActive = messages.length > 0;
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchAdvisors(), fetchClients()])
      .then(([d, a, c]) => {
        setDocs(d);
        setAdvisors(a);
        setClients(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDocs = docs.length;
  const reviewedDocs = docs.filter((d) => d.compliance_status).length;
  const greenDocs = docs.filter((d) => d.compliance_status === "green").length;
  const redDocs = docs.filter((d) => d.compliance_status === "red").length;
  const yellowDocs = docs.filter((d) => d.compliance_status === "yellow").length;
  const complianceRate =
    reviewedDocs > 0 ? Math.round((greenDocs / reviewedDocs) * 100) : 0;
  const clientsWithIssues = clients.filter((c) => c.compliance_issues_red > 0 || c.compliance_issues_yellow > 0).length;

  const statCards = [
    {
      label: t.statDocs,
      value: totalDocs,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
      path: "/documents",
    },
    {
      label: t.statDocsApproved,
      value: greenDocs,
      sub: reviewedDocs > 0 ? `${complianceRate}% ${t.percentOfReviewed}` : undefined,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
      path: "/documents",
    },
    {
      label: t.statDocsIssues,
      value: redDocs + yellowDocs,
      sub: redDocs > 0 ? `${redDocs} ${t.red}, ${yellowDocs} ${t.yellow}` : undefined,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
      path: "/documents",
    },
    {
      label: t.statAdvisors,
      value: advisors.length,
      icon: Briefcase,
      color: "text-violet-600 bg-violet-50",
      path: "/advisors",
    },
    {
      label: t.statClients,
      value: clients.length,
      sub:
        clientsWithIssues > 0
          ? `${clientsWithIssues} ${t.withOpenCases}`
          : undefined,
      icon: Users,
      color: "text-teal-600 bg-teal-50",
      path: "/clients",
    },
    {
      label: t.statCompliance,
      value: `${complianceRate}%`,
      icon: ShieldCheck,
      color: "text-primary bg-primary/10",
      path: "/settings/compliance",
    },
  ];

  if (chatActive) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader title={t.headerTitle} />
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="grid flex-none gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            <AdvisorChat
              expanded
              suggestions={localizedSuggestions}
              subtitle={t.chatSubtitle}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="space-y-6 p-6">
        <div className="py-4">
          <h1 className="font-brand text-2xl tracking-tight">
            {t.welcomeBack}{displayName ? `, ${displayName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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

        {/* AI Assistant */}
        <div>
          <h2 className="mb-3 font-brand text-sm font-medium text-muted-foreground">
            {t.aiAssistant}
          </h2>
          <AdvisorChat
            suggestions={localizedSuggestions}
            subtitle={t.chatSubtitle}
          />
        </div>
      </div>
    </>
  );
}

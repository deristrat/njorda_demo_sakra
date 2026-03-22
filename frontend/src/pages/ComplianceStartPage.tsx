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
import type { DocumentSummary, Advisor, Client } from "@/types";

const COMPLIANCE_SUGGESTIONS = [
  "Vilka rådgivare har lägst compliance?",
  "Visa dokument med allvarliga avvikelser",
  "Ge en överblick över compliance-läget",
];

const COMPLIANCE_SUBTITLE =
  "Fråga om rådgivare, dokument eller compliance-status för hela organisationen";

export function ComplianceStartPage() {
  const navigate = useNavigate();
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
    document.title = "Start — Säkra";
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
      label: "Dokument",
      value: totalDocs,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
      path: "/documents",
    },
    {
      label: "Dokument – godkända",
      value: greenDocs,
      sub: reviewedDocs > 0 ? `${complianceRate}% av granskade` : undefined,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
      path: "/documents",
    },
    {
      label: "Dokument – avvikelser",
      value: redDocs + yellowDocs,
      sub: redDocs > 0 ? `${redDocs} röda, ${yellowDocs} gula` : undefined,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
      path: "/documents",
    },
    {
      label: "Rådgivare",
      value: advisors.length,
      icon: Briefcase,
      color: "text-violet-600 bg-violet-50",
      path: "/advisors",
    },
    {
      label: "Klienter",
      value: clients.length,
      sub:
        clientsWithIssues > 0
          ? `${clientsWithIssues} med öppna ärenden`
          : undefined,
      icon: Users,
      color: "text-teal-600 bg-teal-50",
      path: "/clients",
    },
    {
      label: "Regelefterlevnad",
      value: `${complianceRate}%`,
      icon: ShieldCheck,
      color: "text-primary bg-primary/10",
      path: "/settings/compliance",
    },
  ];

  if (chatActive) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader title="Start" />
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
              suggestions={COMPLIANCE_SUGGESTIONS}
              subtitle={COMPLIANCE_SUBTITLE}
            />
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
            Här är en överblick över organisationens compliance-status
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
            AI Assistent
          </h2>
          <AdvisorChat
            suggestions={COMPLIANCE_SUGGESTIONS}
            subtitle={COMPLIANCE_SUBTITLE}
          />
        </div>
      </div>
    </>
  );
}

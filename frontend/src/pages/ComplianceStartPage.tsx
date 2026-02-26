import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Users,
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchDocuments, fetchAdvisors, fetchClients } from "@/lib/api";
import type { DocumentSummary, Advisor, Client } from "@/types";

export function ComplianceStartPage() {
  const navigate = useNavigate();
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
  const clientsWithIssues = clients.filter((c) => c.compliance_issues > 0).length;

  const statCards = [
    {
      label: "Dokument totalt",
      value: totalDocs,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Godkända",
      value: greenDocs,
      sub: reviewedDocs > 0 ? `${complianceRate}% av granskade` : undefined,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Avvikelser",
      value: redDocs + yellowDocs,
      sub: redDocs > 0 ? `${redDocs} röda, ${yellowDocs} gula` : undefined,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Rådgivare",
      value: advisors.length,
      icon: Briefcase,
      color: "text-violet-600 bg-violet-50",
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
    },
    {
      label: "Regelefterlevnad",
      value: `${complianceRate}%`,
      icon: ShieldCheck,
      color: "text-primary bg-primary/10",
    },
  ];

  const quickActions = [
    {
      label: "Granska dokument",
      description: "Se alla uppladdade dokument och deras compliance-status",
      path: "/documents",
      icon: FileText,
    },
    {
      label: "Rådgivaröversikt",
      description: "Se rådgivare och deras compliance-poäng",
      path: "/advisors",
      icon: Briefcase,
    },
    {
      label: "Regelmotor",
      description: "Hantera och konfigurera compliance-regler",
      path: "/settings/compliance",
      icon: ShieldCheck,
    },
  ];

  return (
    <>
      <AppHeader title="Start" />
      <div className="space-y-6 p-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-4 p-5">
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

        {/* Quick actions */}
        <div>
          <h2 className="mb-3 font-brand text-sm font-medium text-muted-foreground">
            Snabbåtgärder
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Card
                key={action.path}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <action.icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

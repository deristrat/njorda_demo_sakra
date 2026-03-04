import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Users, CheckCircle2, Inbox } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { AdvisorChat } from "@/components/chat/AdvisorChat";
import { fetchDocuments, fetchClients } from "@/lib/api";
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(card.path)}
            >
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

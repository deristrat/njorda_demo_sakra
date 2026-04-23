import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/AppHeader";
import { fetchAuditEvent, type AuditEventDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useLanguage, type Lang } from "@/lib/language";
import { toast } from "sonner";

const translations = {
  sv: {
    pageTitle: "Händelse — Säkra",
    headerTitle: "Händelse",
    notFound: "Händelsen hittades inte.",
    back: "Tillbaka",
    eventInfo: "Händelseinformation",
    labelType: "Typ",
    labelUser: "Användare",
    labelTime: "Tidpunkt",
    labelSummary: "Sammanfattning",
    labelTargetType: "Måltyp",
    labelTargetId: "Mål-ID",
    details: "Detaljer",
    somethingWentWrong: "Något gick fel",
    eventTypes: {
      "document.uploaded": "Dokument uppladdat",
      "document.deleted": "Dokument borttaget",
      "rule.created": "Regel skapad",
      "rule.updated": "Regel uppdaterad",
      "compliance.recheck": "Regelkontroll",
      "user.login": "Inloggning",
    },
  },
  en: {
    pageTitle: "Event — Säkra",
    headerTitle: "Event",
    notFound: "Event not found.",
    back: "Back",
    eventInfo: "Event information",
    labelType: "Type",
    labelUser: "User",
    labelTime: "Time",
    labelSummary: "Summary",
    labelTargetType: "Target type",
    labelTargetId: "Target ID",
    details: "Details",
    somethingWentWrong: "Something went wrong",
    eventTypes: {
      "document.uploaded": "Document uploaded",
      "document.deleted": "Document deleted",
      "rule.created": "Rule created",
      "rule.updated": "Rule updated",
      "compliance.recheck": "Compliance recheck",
      "user.login": "Login",
    },
  },
} satisfies Record<Lang, {
  pageTitle: string;
  headerTitle: string;
  notFound: string;
  back: string;
  eventInfo: string;
  labelType: string;
  labelUser: string;
  labelTime: string;
  labelSummary: string;
  labelTargetType: string;
  labelTargetId: string;
  details: string;
  somethingWentWrong: string;
  eventTypes: Record<string, string>;
}>;

export function AuditEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [event, setEvent] = useState<AuditEventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  useEffect(() => {
    if (!id) return;
    fetchAuditEvent(Number(id))
      .then(setEvent)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <AppHeader title={t.headerTitle} />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <AppHeader title={t.headerTitle} />
        <div className="p-6">
          <p className="text-muted-foreground">{t.notFound}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/audit")}>
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
          <Badge variant="outline">
            {(t.eventTypes as Record<string, string>)[event.event_type] ?? event.event_type}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDateTime(event.created_at)}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.eventInfo}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="font-medium text-muted-foreground">{t.labelType}</dt>
              <dd>{(t.eventTypes as Record<string, string>)[event.event_type] ?? event.event_type}</dd>

              <dt className="font-medium text-muted-foreground">{t.labelUser}</dt>
              <dd>{event.actor}</dd>

              <dt className="font-medium text-muted-foreground">{t.labelTime}</dt>
              <dd>{formatDateTime(event.created_at)}</dd>

              <dt className="font-medium text-muted-foreground">{t.labelSummary}</dt>
              <dd>{event.summary}</dd>

              {event.target_type && (
                <>
                  <dt className="font-medium text-muted-foreground">{t.labelTargetType}</dt>
                  <dd>{event.target_type}</dd>
                </>
              )}

              {event.target_id && (
                <>
                  <dt className="font-medium text-muted-foreground">{t.labelTargetId}</dt>
                  <dd className="font-mono">{event.target_id}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {event.detail && (
          <Card>
            <CardHeader>
              <CardTitle>{t.details}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
                {JSON.stringify(event.detail, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

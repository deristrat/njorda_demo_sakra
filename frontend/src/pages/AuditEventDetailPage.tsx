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
import { toast } from "sonner";

const EVENT_TYPE_LABELS: Record<string, string> = {
  "document.uploaded": "Dokument uppladdat",
  "document.deleted": "Dokument borttaget",
  "rule.created": "Regel skapad",
  "rule.updated": "Regel uppdaterad",
  "compliance.recheck": "Regelkontroll",
  "user.login": "Inloggning",
};

export function AuditEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<AuditEventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Händelse — Säkra";
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchAuditEvent(Number(id))
      .then(setEvent)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Något gick fel"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <AppHeader title="Händelse" />
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
        <AppHeader title="Händelse" />
        <div className="p-6">
          <p className="text-muted-foreground">Händelsen hittades inte.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Händelse" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/audit")}>
            <ArrowLeft className="mr-1 size-4" />
            Tillbaka
          </Button>
          <Badge variant="outline">
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDateTime(event.created_at)}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Händelseinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="font-medium text-muted-foreground">Typ</dt>
              <dd>{EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}</dd>

              <dt className="font-medium text-muted-foreground">Användare</dt>
              <dd>{event.actor}</dd>

              <dt className="font-medium text-muted-foreground">Tidpunkt</dt>
              <dd>{formatDateTime(event.created_at)}</dd>

              <dt className="font-medium text-muted-foreground">Sammanfattning</dt>
              <dd>{event.summary}</dd>

              {event.target_type && (
                <>
                  <dt className="font-medium text-muted-foreground">Måltyp</dt>
                  <dd>{event.target_type}</dd>
                </>
              )}

              {event.target_id && (
                <>
                  <dt className="font-medium text-muted-foreground">Mål-ID</dt>
                  <dd className="font-mono">{event.target_id}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {event.detail && (
          <Card>
            <CardHeader>
              <CardTitle>Detaljer</CardTitle>
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

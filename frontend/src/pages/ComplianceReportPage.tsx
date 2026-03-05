import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FileBarChart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  generateComplianceReport,
  fetchComplianceReports,
} from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { ComplianceReportRunSummary } from "@/types";

function StatusDots({ dist }: { dist: { green: number; yellow: number; red: number } }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex items-center gap-1">
        <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
        {dist.green}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block size-2.5 rounded-full bg-amber-400" />
        {dist.yellow}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block size-2.5 rounded-full bg-red-500" />
        {dist.red}
      </span>
    </div>
  );
}

export function ComplianceReportPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ComplianceReportRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    document.title = "Compliance rapport — Säkra";
  }, []);

  useEffect(() => {
    fetchComplianceReports()
      .then(setReports)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Något gick fel"))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateComplianceReport();
      toast.success("Rapport genererad");
      navigate(`/reports/compliance/${result.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte generera rapport");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <AppHeader title="Compliance rapport" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Generera och granska sammanfattande compliance-rapporter.
          </p>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileBarChart className="mr-2 size-4" />
            )}
            Generera rapport
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-card py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileBarChart className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="font-brand text-lg">Inga rapporter ännu</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Klicka på &ldquo;Generera rapport&rdquo; för att skapa din första
                compliance-rapport.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Genererad av</TableHead>
                    <TableHead>Snittpoäng</TableHead>
                    <TableHead>Statusfördelning</TableHead>
                    <TableHead>Compliance-grad</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer transition-colors hover:bg-secondary/50"
                      onClick={() => navigate(`/reports/compliance/${r.id}`)}
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(r.created_at)}
                      </TableCell>
                      <TableCell>{r.generated_by}</TableCell>
                      <TableCell>
                        {r.summary_stats ? `${r.summary_stats.average_score}%` : "—"}
                      </TableCell>
                      <TableCell>
                        {r.summary_stats ? (
                          <StatusDots dist={r.summary_stats.status_distribution} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {r.summary_stats ? `${r.summary_stats.compliance_rate}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "completed" ? "default" : "destructive"}
                          className="font-normal"
                        >
                          {r.status === "completed" ? "Klar" : r.status === "failed" ? "Misslyckades" : "Genererar..."}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Visar {reports.length} rapport{reports.length !== 1 ? "er" : ""}
            </p>
          </>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import {
  CircleCheck,
  CircleAlert,
  CircleX,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchDocumentCompliance,
  recheckDocumentCompliance,
} from "@/lib/api";
import type { ComplianceReport, ComplianceRuleOutcome } from "@/types";

interface CompliancePanelProps {
  documentId: number;
}

const STATUS_LABELS: Record<string, string> = {
  green: "Godkänd",
  yellow: "Varningar",
  red: "Underkänd",
};


export function CompliancePanel({ documentId }: CompliancePanelProps) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [showPassed, setShowPassed] = useState(false);

  useEffect(() => {
    fetchDocumentCompliance(documentId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleRecheck = async () => {
    setRechecking(true);
    try {
      const result = await recheckDocumentCompliance(documentId);
      setReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setRechecking(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laddar regelefterlevnad...
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Ingen regelefterlevnadsdata tillgänglig.
        </CardContent>
      </Card>
    );
  }

  const failed = report.outcomes.filter((o) => o.status === "failed");
  const passed = report.outcomes.filter((o) => o.status === "passed");
  const skipped = report.outcomes.filter((o) => o.status === "skipped");

  const errors = failed.filter((o) => o.severity === "error");
  const warnings = failed.filter((o) => o.severity === "warning");

  const statusColor =
    report.status === "green"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : report.status === "yellow"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-red-100 text-red-800 border-red-200";

  const scoreColor =
    report.status === "green"
      ? "text-emerald-600"
      : report.status === "yellow"
        ? "text-amber-500"
        : "text-red-500";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Regelefterlevnad</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecheck}
            disabled={rechecking}
          >
            <RefreshCw
              className={`mr-1 size-3.5 ${rechecking ? "animate-spin" : ""}`}
            />
            Kontrollera igen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score + status header */}
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-brand font-bold ${scoreColor}`}>
            {report.score}
          </div>
          <div className="space-y-1">
            <Badge variant="outline" className={statusColor}>
              {STATUS_LABELS[report.status] || report.status}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {report.summary.passed} av {report.summary.total_rules} kontroller
              godkända
              {report.summary.skipped > 0 &&
                ` — ${report.summary.skipped} överhoppade`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {report.summary.passed > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{
                width: `${(report.summary.passed / report.summary.total_rules) * 100}%`,
              }}
            />
          )}
          {report.summary.warnings > 0 && (
            <div
              className="bg-amber-400 transition-all"
              style={{
                width: `${(report.summary.warnings / report.summary.total_rules) * 100}%`,
              }}
            />
          )}
          {report.summary.errors > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{
                width: `${(report.summary.errors / report.summary.total_rules) * 100}%`,
              }}
            />
          )}
          {report.summary.skipped > 0 && (
            <div
              className="bg-muted-foreground/20 transition-all"
              style={{
                width: `${(report.summary.skipped / report.summary.total_rules) * 100}%`,
              }}
            />
          )}
        </div>

        {/* Failed rules — errors */}
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((outcome) => (
              <OutcomeRow key={outcome.rule_id} outcome={outcome} />
            ))}
          </div>
        )}

        {/* Failed rules — warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((outcome) => (
              <OutcomeRow key={outcome.rule_id} outcome={outcome} />
            ))}
          </div>
        )}

        {/* Skipped rules */}
        {skipped.length > 0 && (
          <div className="space-y-1">
            {skipped.map((outcome) => (
              <div
                key={outcome.rule_id}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground"
              >
                <Minus className="mt-0.5 size-4 shrink-0" />
                <div>
                  <span>{outcome.rule_name}</span>
                  <span className="ml-2 text-xs opacity-60">
                    Överhoppad
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Passed rules — collapsible */}
        {passed.length > 0 && (
          <div>
            <button
              onClick={() => setShowPassed(!showPassed)}
              className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {showPassed ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              Godkända kontroller ({passed.length})
            </button>
            {showPassed && (
              <div className="mt-1 space-y-1">
                {passed.map((outcome) => (
                  <div
                    key={outcome.rule_id}
                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground"
                  >
                    <CircleCheck className="size-4 shrink-0 text-emerald-500" />
                    <span>{outcome.rule_name}</span>
                    {outcome.tier === 2 && (
                      <Badge
                        variant="outline"
                        className="ml-auto h-5 px-1.5 text-[10px]"
                      >
                        <Sparkles className="mr-0.5 size-2.5" />
                        AI
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OutcomeRow({ outcome }: { outcome: ComplianceRuleOutcome }) {
  const [expanded, setExpanded] = useState(false);

  const Icon = outcome.severity === "error" ? CircleX : CircleAlert;
  const iconColor =
    outcome.severity === "error" ? "text-red-500" : "text-amber-500";

  return (
    <div className="rounded-md border px-3 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 text-left text-sm"
      >
        <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{outcome.rule_name}</span>
            {outcome.tier === 2 && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px]"
              >
                <Sparkles className="mr-0.5 size-2.5" />
                AI
              </Badge>
            )}
          </div>
          {outcome.findings.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {outcome.findings.length === 1
                ? outcome.findings[0].message
                : `${outcome.findings.length} problem hittade`}
            </p>
          )}
        </div>
        {(outcome.remediation || outcome.findings.length > 1) && (
          <ChevronDown
            className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {expanded && (
        <div className="mt-2 ml-6 space-y-2">
          {outcome.findings.length > 1 &&
            outcome.findings.map((f, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {f.message}
              </p>
            ))}
          {outcome.remediation && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1.5">
              {outcome.remediation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

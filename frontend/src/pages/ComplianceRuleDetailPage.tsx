import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Save } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchComplianceRules, updateComplianceRule } from "@/lib/api";
import type { ComplianceRuleConfig } from "@/types";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  metadata: "Metadata",
  kyc: "KYC / Lämplighetsbedömning",
  recommendations: "Rekommendationer",
  transfer: "Pensionsflytt",
  esg: "Hållbarhet (ESG)",
  suitability_quality: "Kvalitetsbedömning",
  costs: "Kostnader & Ersättning",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  all: "Alla",
  investment_advice: "Rådgivning",
  pension_transfer: "Pensionsflytt",
  suitability_assessment: "Lämplighetsbedömning",
  insurance_advice: "Försäkring",
};

const RULE_TYPE_LABELS: Record<string, string> = {
  field_present: "Fält finns",
  field_not_empty: "Fält ej tomt",
  field_matches: "Fält matchar",
  llm_check: "AI-granskning",
  composite: "Sammansatt",
};

export function ComplianceRuleDetailPage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const [rule, setRule] = useState<ComplianceRuleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [severityOverride, setSeverityOverride] = useState("default");
  const [maxDeduction, setMaxDeduction] = useState(0);
  const [remediation, setRemediation] = useState("");

  useEffect(() => {
    if (!ruleId) return;
    fetchComplianceRules()
      .then((rules) => {
        const found = rules.find((r) => r.rule_id === ruleId);
        if (found) {
          setRule(found);
          setName(found.name);
          setEnabled(found.enabled);
          setSeverityOverride(found.severity_override || "default");
          setMaxDeduction(found.max_deduction);
          setRemediation(found.remediation || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ruleId]);

  useEffect(() => {
    if (rule) {
      document.title = `${rule.name} — Njorda Advisor`;
    }
  }, [rule]);

  const hasChanges =
    rule &&
    (name !== rule.name ||
      enabled !== rule.enabled ||
      severityOverride !== (rule.severity_override || "default") ||
      maxDeduction !== rule.max_deduction ||
      remediation !== (rule.remediation || ""));

  const handleSave = async () => {
    if (!rule) return;
    setSaving(true);
    try {
      const updated = await updateComplianceRule(rule.rule_id, {
        name,
        enabled,
        severity_override: severityOverride === "default" ? "default" : severityOverride,
        max_deduction: maxDeduction,
        remediation: remediation || null,
      });
      setRule(updated);
      toast.success("Regeln har sparats");
    } catch {
      toast.error("Kunde inte spara regeln");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Regel" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full max-w-3xl" />
        </div>
      </>
    );
  }

  if (!rule) {
    return (
      <>
        <AppHeader title="Regel" />
        <div className="p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/compliance")}
          >
            <ArrowLeft className="mr-1 size-4" />
            Tillbaka
          </Button>
          <p className="text-muted-foreground mt-4">Regeln hittades inte.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title={rule.name} />
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Top bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/compliance")}
          >
            <ArrowLeft className="mr-1 size-4" />
            Tillbaka
          </Button>
          <Badge variant="outline">
            {CATEGORY_LABELS[rule.category] || rule.category}
          </Badge>
          {rule.tier === 2 && (
            <Badge variant="outline">
              <Sparkles className="mr-0.5 size-3" />
              AI
            </Badge>
          )}
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Aktiv" : "Inaktiv"}
          </Badge>
          <Button
            size="sm"
            className="ml-auto"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            <Save className="mr-1 size-4" />
            {saving ? "Sparar..." : "Spara"}
          </Button>
        </div>

        {/* Rule info (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regelinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Regel-ID</dt>
                <dd className="text-sm font-medium font-brand">
                  {rule.rule_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Regeltyp</dt>
                <dd className="text-sm font-medium">
                  {RULE_TYPE_LABELS[rule.rule_type] || rule.rule_type}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Nivå</dt>
                <dd className="text-sm font-medium">
                  {rule.tier === 1 ? "Standard" : "AI (Tier 2)"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Dokumenttyper</dt>
                <dd className="text-sm font-medium">
                  {(rule.document_types || [])
                    .map((t) => DOC_TYPE_LABELS[t] || t)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Standardallvarlighet
                </dt>
                <dd className="text-sm font-medium">
                  {rule.default_severity === "error" ? "Fel" : "Varning"}
                </dd>
              </div>
              {rule.parent_rule_id && (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Överordnad regel
                  </dt>
                  <dd className="text-sm font-medium font-brand">
                    {rule.parent_rule_id}
                  </dd>
                </div>
              )}
            </dl>
            {rule.description && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-xs text-muted-foreground mb-1">
                  Beskrivning
                </dt>
                <dd className="text-sm">{rule.description}</dd>
              </div>
            )}
            {rule.rule_params && Object.keys(rule.rule_params).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-xs text-muted-foreground mb-1">
                  Regelparametrar
                </dt>
                <dd className="text-sm font-brand bg-muted rounded-md px-3 py-2 whitespace-pre-wrap">
                  {JSON.stringify(rule.rule_params, null, 2)}
                </dd>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editable settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inställningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Namn</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Aktiv</Label>
                <p className="text-xs text-muted-foreground">
                  Inaktiva regler körs inte vid granskning
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Allvarlighetsgrad</Label>
                <Select
                  value={severityOverride}
                  onValueChange={setSeverityOverride}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      Standard (
                      {rule.default_severity === "error" ? "Fel" : "Varning"})
                    </SelectItem>
                    <SelectItem value="error">Fel</SelectItem>
                    <SelectItem value="warning">Varning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-deduction">Maxpoäng (avdrag)</Label>
                <Input
                  id="max-deduction"
                  type="number"
                  min={0}
                  max={100}
                  value={maxDeduction}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0 && v <= 100) setMaxDeduction(v);
                  }}
                  className="w-24"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remediation">Åtgärdsförslag</Label>
              <Textarea
                id="remediation"
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                rows={3}
                placeholder="Beskriv hur regeln kan åtgärdas vid avvikelse..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="mr-1 size-4" />
            {saving ? "Sparar..." : "Spara ändringar"}
          </Button>
        </div>
      </div>
    </>
  );
}

import { useEffect, useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  fetchComplianceRules,
  updateComplianceRule,
  fetchRuleHistory,
  type AuditEntry,
} from "@/lib/api";
import type { ComplianceRuleConfig } from "@/types";
import { toast } from "sonner";
import {
  CATEGORY_LABELS,
  DOC_TYPE_OPTIONS,
  RULE_TYPE_LABELS,
  RuleParamsEditor,
} from "@/components/compliance/RuleParamsEditor";

// No parent sentinel for the Select component
const NO_PARENT = "__none__";

// Swedish field labels for diff display
const FIELD_LABELS: Record<string, string> = {
  name: "Namn",
  description: "Beskrivning",
  enabled: "Aktiv",
  severity_override: "Allvarlighetsgrad",
  max_deduction: "Maxpoäng",
  remediation: "Åtgärdsförslag",
  rule_params: "Regelparametrar",
  document_types: "Dokumenttyper",
  parent_rule_id: "Överordnad regel",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "(tom)";
  if (typeof v === "boolean") return v ? "Ja" : "Nej";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

export function ComplianceRuleDetailPage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const [rule, setRule] = useState<ComplianceRuleConfig | null>(null);
  const [allRules, setAllRules] = useState<ComplianceRuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<AuditEntry[]>([]);

  // Editable fields — Card 3 (Inställningar)
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [severityOverride, setSeverityOverride] = useState("default");
  const [maxDeduction, setMaxDeduction] = useState(0);
  const [remediation, setRemediation] = useState("");

  // Editable fields — Card 2 (Regelkonfiguration)
  const [description, setDescription] = useState("");
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [parentRuleId, setParentRuleId] = useState<string>(NO_PARENT);
  const [ruleParams, setRuleParams] = useState<Record<string, unknown>>({});

  const loadHistory = (id: string) => {
    fetchRuleHistory(id).then(setHistory).catch((e) => toast.error(e instanceof Error ? e.message : "Något gick fel"));
  };

  useEffect(() => {
    if (!ruleId) return;
    fetchComplianceRules()
      .then((rules) => {
        setAllRules(rules);
        const found = rules.find((r) => r.rule_id === ruleId);
        if (found) {
          setRule(found);
          // Card 3
          setName(found.name);
          setEnabled(found.enabled);
          setSeverityOverride(found.severity_override || "default");
          setMaxDeduction(found.max_deduction);
          setRemediation(found.remediation || "");
          // Card 2
          setDescription(found.description || "");
          setDocumentTypes(found.document_types || []);
          setParentRuleId(found.parent_rule_id || NO_PARENT);
          setRuleParams(
            found.rule_params
              ? { ...found.rule_params }
              : {},
          );
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Något gick fel"))
      .finally(() => setLoading(false));
    loadHistory(ruleId);
  }, [ruleId]);

  useEffect(() => {
    if (rule) {
      document.title = `${rule.name} — Njorda Advisor`;
    }
  }, [rule]);

  // Parent rule options: all rules except self
  const parentOptions = useMemo(
    () => allRules.filter((r) => r.rule_id !== ruleId),
    [allRules, ruleId],
  );

  // Deep-compare rule_params for change detection
  const paramsChanged = useMemo(() => {
    if (!rule) return false;
    const orig = rule.rule_params || {};
    return JSON.stringify(ruleParams) !== JSON.stringify(orig);
  }, [ruleParams, rule]);

  const hasChanges =
    rule &&
    (name !== rule.name ||
      enabled !== rule.enabled ||
      severityOverride !== (rule.severity_override || "default") ||
      maxDeduction !== rule.max_deduction ||
      remediation !== (rule.remediation || "") ||
      description !== (rule.description || "") ||
      JSON.stringify(documentTypes) !==
        JSON.stringify(rule.document_types || []) ||
      (parentRuleId === NO_PARENT ? null : parentRuleId) !==
        (rule.parent_rule_id || null) ||
      paramsChanged);

  // Frontend validation: disable save if required params are empty
  const paramsValid = useMemo(() => {
    if (!rule) return true;
    const rt = rule.rule_type;
    if (rt === "require_field" || rt === "require_any_items") {
      const fp = ruleParams.field_path;
      return typeof fp === "string" && fp.trim() !== "";
    }
    if (rt === "require_field_on_items") {
      const lp = ruleParams.list_path;
      const ifield = ruleParams.item_field;
      return (
        typeof lp === "string" &&
        lp.trim() !== "" &&
        typeof ifield === "string" &&
        ifield.trim() !== ""
      );
    }
    if (rt === "ai_evaluate") {
      const prompt = ruleParams.prompt;
      return typeof prompt === "string" && prompt.trim() !== "";
    }
    if (rt === "custom") {
      const fn = ruleParams.function_name;
      return typeof fn === "string" && fn.trim() !== "";
    }
    return true;
  }, [rule, ruleParams]);

  const docTypesValid = documentTypes.length > 0;
  const canSave = hasChanges && paramsValid && docTypesValid;

  const handleSave = async () => {
    if (!rule) return;
    setSaving(true);
    try {
      const updated = await updateComplianceRule(rule.rule_id, {
        name,
        enabled,
        severity_override:
          severityOverride === "default" ? "default" : severityOverride,
        max_deduction: maxDeduction,
        remediation: remediation || null,
        description,
        rule_params: ruleParams,
        document_types: documentTypes,
        parent_rule_id:
          parentRuleId === NO_PARENT ? "" : parentRuleId,
      });
      setRule(updated);
      toast.success("Regeln har sparats");
      if (ruleId) loadHistory(ruleId);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Kunde inte spara regeln";
      toast.error(msg);
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
            disabled={!canSave || saving}
          >
            <Save className="mr-1 size-4" />
            {saving ? "Sparar..." : "Spara"}
          </Button>
        </div>

        {/* Card 1 — Regelinformation (read-only) */}
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
                <dt className="text-xs text-muted-foreground">
                  Standardallvarlighet
                </dt>
                <dd className="text-sm font-medium">
                  {rule.default_severity === "error" ? "Fel" : "Varning"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Card 2 — Regelkonfiguration (editable) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regelkonfiguration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="rule-description">Beskrivning</Label>
              <Textarea
                id="rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Beskriv vad regeln kontrollerar..."
              />
            </div>

            {/* Document types */}
            <div className="space-y-2">
              <Label>Dokumenttyper</Label>
              <p className="text-xs text-muted-foreground">
                Välj vilka dokumenttyper regeln ska tillämpas på
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {DOC_TYPE_OPTIONS.map(([value, label]) => {
                  const isAll = value === "all";
                  const allSelected = documentTypes.includes("all");
                  const checked = documentTypes.includes(value);
                  return (
                    <label
                      key={value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={!isAll && allSelected}
                        onCheckedChange={(c) => {
                          if (isAll) {
                            setDocumentTypes(c ? ["all"] : []);
                          } else {
                            setDocumentTypes((prev) =>
                              c
                                ? [...prev.filter((t) => t !== "all"), value]
                                : prev.filter((t) => t !== value),
                            );
                          }
                        }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              {!docTypesValid && (
                <p className="text-xs text-destructive">
                  Minst en dokumenttyp måste vara vald
                </p>
              )}
            </div>

            {/* Parent rule */}
            <div className="space-y-1.5">
              <Label>Överordnad regel</Label>
              <Select value={parentRuleId} onValueChange={setParentRuleId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Välj..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>
                    Ingen (fristående)
                  </SelectItem>
                  {parentOptions.map((r) => (
                    <SelectItem key={r.rule_id} value={r.rule_id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rule params — type-aware editor */}
            <RuleParamsEditor
              ruleType={rule.rule_type}
              params={ruleParams}
              onChange={setRuleParams}
            />
          </CardContent>
        </Card>

        {/* Card 3 — Inställningar (existing editable) */}
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

        {/* Card 4 — Historik */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historik</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga ändringar registrerade.</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="border-l-2 border-muted pl-4 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={entry.action === "created" ? "default" : "secondary"} className="text-[10px] h-5">
                        {entry.action === "created" ? "Skapad" : "Uppdaterad"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.changed_by}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleString("sv-SE")}
                      </span>
                    </div>
                    {entry.action === "updated" && entry.old_values && (
                      <DiffView oldValues={entry.old_values} newValues={entry.new_values} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!canSave || saving}>
            <Save className="mr-1 size-4" />
            {saving ? "Sparar..." : "Spara ändringar"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Diff view for audit entries
// ---------------------------------------------------------------------------

function DiffView({
  oldValues,
  newValues,
}: {
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}) {
  const changedFields = Object.keys(newValues).filter(
    (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]),
  );

  if (changedFields.length === 0) {
    return <p className="text-xs text-muted-foreground">Inga synliga ändringar.</p>;
  }

  return (
    <div className="space-y-1 text-xs">
      {changedFields.map((key) => (
        <div key={key} className="flex flex-wrap gap-1">
          <span className="font-medium">{FIELD_LABELS[key] || key}:</span>
          <span className="line-through text-red-600">{formatValue(oldValues[key])}</span>
          <span className="text-green-600">{formatValue(newValues[key])}</span>
        </div>
      ))}
    </div>
  );
}

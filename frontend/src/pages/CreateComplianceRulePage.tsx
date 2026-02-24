import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { createComplianceRule, fetchComplianceRules } from "@/lib/api";
import type { ComplianceRuleConfig } from "@/types";
import { toast } from "sonner";
import {
  CATEGORY_LABELS,
  DOC_TYPE_OPTIONS,
  RULE_TYPE_LABELS,
  RuleParamsEditor,
} from "@/components/compliance/RuleParamsEditor";

const NO_PARENT = "__none__";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS);
const RULE_TYPE_OPTIONS = Object.entries(RULE_TYPE_LABELS);

export function CreateComplianceRulePage() {
  const navigate = useNavigate();
  const [allRules, setAllRules] = useState<ComplianceRuleConfig[]>([]);
  const [saving, setSaving] = useState(false);

  // Grundinformation
  const [ruleId, setRuleId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [ruleType, setRuleType] = useState("");
  const [defaultSeverity, setDefaultSeverity] = useState("warning");
  const [tier, setTier] = useState(1);

  // Konfiguration
  const [description, setDescription] = useState("");
  const [documentTypes, setDocumentTypes] = useState<string[]>(["all"]);
  const [parentRuleId, setParentRuleId] = useState<string>(NO_PARENT);
  const [ruleParams, setRuleParams] = useState<Record<string, unknown>>({});

  // Inställningar
  const [enabled, setEnabled] = useState(true);
  const [maxDeduction, setMaxDeduction] = useState(5);
  const [remediation, setRemediation] = useState("");

  useEffect(() => {
    document.title = "Ny regel — Säkra";
    fetchComplianceRules().then(setAllRules).catch((e) => toast.error(e instanceof Error ? e.message : "Något gick fel"));
  }, []);

  const parentOptions = useMemo(
    () => allRules.filter((r) => r.rule_id !== ruleId),
    [allRules, ruleId],
  );

  const paramsValid = useMemo(() => {
    if (!ruleType) return true;
    if (ruleType === "require_field" || ruleType === "require_any_items") {
      const fp = ruleParams.field_path;
      return typeof fp === "string" && fp.trim() !== "";
    }
    if (ruleType === "require_field_on_items") {
      const lp = ruleParams.list_path;
      const ifield = ruleParams.item_field;
      return (
        typeof lp === "string" && lp.trim() !== "" &&
        typeof ifield === "string" && ifield.trim() !== ""
      );
    }
    if (ruleType === "ai_evaluate") {
      const prompt = ruleParams.prompt;
      return typeof prompt === "string" && prompt.trim() !== "";
    }
    if (ruleType === "custom") {
      const fn = ruleParams.function_name;
      return typeof fn === "string" && fn.trim() !== "";
    }
    return true;
  }, [ruleType, ruleParams]);

  const canSave =
    ruleId.trim() !== "" &&
    name.trim() !== "" &&
    category !== "" &&
    ruleType !== "" &&
    documentTypes.length > 0 &&
    paramsValid;

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createComplianceRule({
        rule_id: ruleId.trim(),
        name: name.trim(),
        category,
        rule_type: ruleType,
        default_severity: defaultSeverity,
        tier,
        description: description || undefined,
        rule_params: Object.keys(ruleParams).length > 0 ? ruleParams : undefined,
        document_types: documentTypes,
        parent_rule_id: parentRuleId === NO_PARENT ? null : parentRuleId,
        max_deduction: maxDeduction,
        remediation: remediation || undefined,
        enabled,
      });
      toast.success("Regeln har skapats");
      navigate(`/settings/compliance/${ruleId.trim()}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kunde inte skapa regeln";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title="Ny regel" />
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/compliance")}
          >
            <ArrowLeft className="mr-1 size-4" />
            Tillbaka
          </Button>
        </div>

        {/* Card 1 — Grundinformation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grundinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-rule-id">Regel-ID</Label>
                <Input
                  id="new-rule-id"
                  value={ruleId}
                  onChange={(e) => setRuleId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder="t.ex. KYC_015"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-rule-name">Namn</Label>
                <Input
                  id="new-rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="t.ex. Kontrollera riskprofil"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Välj kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Regeltyp</Label>
                <Select value={ruleType} onValueChange={(v) => { setRuleType(v); setRuleParams({}); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Välj regeltyp..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPE_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Standardallvarlighet</Label>
                <Select value={defaultSeverity} onValueChange={setDefaultSeverity}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Varning</SelectItem>
                    <SelectItem value="error">Fel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nivå</Label>
                <Select value={String(tier)} onValueChange={(v) => setTier(Number(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Standard (Tier 1)</SelectItem>
                    <SelectItem value="2">AI (Tier 2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Konfiguration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konfiguration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-rule-description">Beskrivning</Label>
              <Textarea
                id="new-rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Beskriv vad regeln kontrollerar..."
              />
            </div>

            {/* Document types */}
            <div className="space-y-2">
              <Label>Dokumenttyper</Label>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {DOC_TYPE_OPTIONS.map(([value, label]) => {
                  const isAll = value === "all";
                  const allSelected = documentTypes.includes("all");
                  const checked = documentTypes.includes(value);
                  return (
                    <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
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
              {documentTypes.length === 0 && (
                <p className="text-xs text-destructive">Minst en dokumenttyp måste vara vald</p>
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
                  <SelectItem value={NO_PARENT}>Ingen (fristående)</SelectItem>
                  {parentOptions.map((r) => (
                    <SelectItem key={r.rule_id} value={r.rule_id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rule params */}
            {ruleType && (
              <RuleParamsEditor
                ruleType={ruleType}
                params={ruleParams}
                onChange={setRuleParams}
              />
            )}
          </CardContent>
        </Card>

        {/* Card 3 — Inställningar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inställningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Aktiv</Label>
                <p className="text-xs text-muted-foreground">
                  Inaktiva regler körs inte vid granskning
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-max-deduction">Maxpoäng (avdrag)</Label>
              <Input
                id="new-max-deduction"
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

            <div className="space-y-1.5">
              <Label htmlFor="new-remediation">Åtgärdsförslag</Label>
              <Textarea
                id="new-remediation"
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                rows={3}
                placeholder="Beskriv hur regeln kan åtgärdas vid avvikelse..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={!canSave || saving}>
            <Plus className="mr-1 size-4" />
            {saving ? "Skapar..." : "Skapa regel"}
          </Button>
        </div>
      </div>
    </>
  );
}

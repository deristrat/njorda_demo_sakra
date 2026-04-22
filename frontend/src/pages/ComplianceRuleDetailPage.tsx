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
import { useLanguage, type Lang } from "@/lib/language";
import type { ComplianceRuleConfig } from "@/types";
import { toast } from "sonner";
import {
  CATEGORY_LABELS_BY_LANG,
  RULE_TYPE_LABELS_BY_LANG,
  getDocTypeOptions,
  RuleParamsEditor,
} from "@/components/compliance/RuleParamsEditor";

// No parent sentinel for the Select component
const NO_PARENT = "__none__";

const translations = {
  sv: {
    pageHeader: "Regel",
    somethingWentWrong: "Något gick fel",
    back: "Tillbaka",
    notFound: "Regeln hittades inte.",
    ruleSaved: "Regeln har sparats",
    couldNotSave: "Kunde inte spara regeln",
    active: "Aktiv",
    inactive: "Inaktiv",
    saving: "Sparar...",
    save: "Spara",
    saveChanges: "Spara ändringar",
    cardInfoTitle: "Regelinformation",
    labelRuleId: "Regel-ID",
    labelRuleType: "Regeltyp",
    labelTier: "Nivå",
    labelDefaultSeverity: "Standardallvarlighet",
    tierStandard: "Standard",
    tierAI: "AI (Tier 2)",
    severityError: "Fel",
    severityWarning: "Varning",
    cardConfigTitle: "Regelkonfiguration",
    description: "Beskrivning",
    descriptionPlaceholder: "Beskriv vad regeln kontrollerar...",
    documentTypes: "Dokumenttyper",
    documentTypesHelp: "Välj vilka dokumenttyper regeln ska tillämpas på",
    atLeastOneDocType: "Minst en dokumenttyp måste vara vald",
    parentRule: "Överordnad regel",
    selectPlaceholder: "Välj...",
    noneStandalone: "Ingen (fristående)",
    cardSettingsTitle: "Inställningar",
    name: "Namn",
    activeHelp: "Inaktiva regler körs inte vid granskning",
    severityLabel: "Allvarlighetsgrad",
    severityDefault: "Standard",
    maxDeduction: "Maxpoäng (avdrag)",
    remediation: "Åtgärdsförslag",
    remediationPlaceholder: "Beskriv hur regeln kan åtgärdas vid avvikelse...",
    historyTitle: "Historik",
    noHistory: "Inga ändringar registrerade.",
    actionCreated: "Skapad",
    actionUpdated: "Uppdaterad",
    noVisibleChanges: "Inga synliga ändringar.",
    empty: "(tom)",
    yes: "Ja",
    no: "Nej",
    fieldLabels: {
      name: "Namn",
      description: "Beskrivning",
      enabled: "Aktiv",
      severity_override: "Allvarlighetsgrad",
      max_deduction: "Maxpoäng",
      remediation: "Åtgärdsförslag",
      rule_params: "Regelparametrar",
      document_types: "Dokumenttyper",
      parent_rule_id: "Överordnad regel",
    } as Record<string, string>,
    locale: "sv-SE",
  },
  en: {
    pageHeader: "Rule",
    somethingWentWrong: "Something went wrong",
    back: "Back",
    notFound: "Rule not found.",
    ruleSaved: "Rule saved",
    couldNotSave: "Could not save rule",
    active: "Active",
    inactive: "Inactive",
    saving: "Saving…",
    save: "Save",
    saveChanges: "Save changes",
    cardInfoTitle: "Rule information",
    labelRuleId: "Rule ID",
    labelRuleType: "Rule type",
    labelTier: "Tier",
    labelDefaultSeverity: "Default severity",
    tierStandard: "Standard",
    tierAI: "AI (Tier 2)",
    severityError: "Error",
    severityWarning: "Warning",
    cardConfigTitle: "Rule configuration",
    description: "Description",
    descriptionPlaceholder: "Describe what the rule checks…",
    documentTypes: "Document types",
    documentTypesHelp: "Choose which document types the rule applies to",
    atLeastOneDocType: "At least one document type must be selected",
    parentRule: "Parent rule",
    selectPlaceholder: "Select…",
    noneStandalone: "None (standalone)",
    cardSettingsTitle: "Settings",
    name: "Name",
    activeHelp: "Inactive rules are not run during review",
    severityLabel: "Severity",
    severityDefault: "Default",
    maxDeduction: "Max deduction",
    remediation: "Remediation",
    remediationPlaceholder: "Describe how the rule can be remediated when violated…",
    historyTitle: "History",
    noHistory: "No changes recorded.",
    actionCreated: "Created",
    actionUpdated: "Updated",
    noVisibleChanges: "No visible changes.",
    empty: "(empty)",
    yes: "Yes",
    no: "No",
    fieldLabels: {
      name: "Name",
      description: "Description",
      enabled: "Active",
      severity_override: "Severity",
      max_deduction: "Max deduction",
      remediation: "Remediation",
      rule_params: "Rule parameters",
      document_types: "Document types",
      parent_rule_id: "Parent rule",
    } as Record<string, string>,
    locale: "en-GB",
  },
} satisfies Record<Lang, {
  pageHeader: string;
  somethingWentWrong: string;
  back: string;
  notFound: string;
  ruleSaved: string;
  couldNotSave: string;
  active: string;
  inactive: string;
  saving: string;
  save: string;
  saveChanges: string;
  cardInfoTitle: string;
  labelRuleId: string;
  labelRuleType: string;
  labelTier: string;
  labelDefaultSeverity: string;
  tierStandard: string;
  tierAI: string;
  severityError: string;
  severityWarning: string;
  cardConfigTitle: string;
  description: string;
  descriptionPlaceholder: string;
  documentTypes: string;
  documentTypesHelp: string;
  atLeastOneDocType: string;
  parentRule: string;
  selectPlaceholder: string;
  noneStandalone: string;
  cardSettingsTitle: string;
  name: string;
  activeHelp: string;
  severityLabel: string;
  severityDefault: string;
  maxDeduction: string;
  remediation: string;
  remediationPlaceholder: string;
  historyTitle: string;
  noHistory: string;
  actionCreated: string;
  actionUpdated: string;
  noVisibleChanges: string;
  empty: string;
  yes: string;
  no: string;
  fieldLabels: Record<string, string>;
  locale: string;
}>;

type T = typeof translations["sv"];

function formatValue(v: unknown, t: T): string {
  if (v === null || v === undefined) return t.empty;
  if (typeof v === "boolean") return v ? t.yes : t.no;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

export function ComplianceRuleDetailPage() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const CATEGORY_LABELS = CATEGORY_LABELS_BY_LANG[lang];
  const RULE_TYPE_LABELS = RULE_TYPE_LABELS_BY_LANG[lang];
  const DOC_TYPE_OPTIONS = getDocTypeOptions(lang);
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
    fetchRuleHistory(id).then(setHistory).catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong));
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
      .catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong))
      .finally(() => setLoading(false));
    loadHistory(ruleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId]);

  useEffect(() => {
    if (rule) {
      document.title = `${rule.name} — Säkra`;
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
      toast.success(t.ruleSaved);
      if (ruleId) loadHistory(ruleId);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t.couldNotSave;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title={t.pageHeader} />
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
        <AppHeader title={t.pageHeader} />
        <div className="p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/compliance")}
          >
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
          <p className="text-muted-foreground mt-4">{t.notFound}</p>
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
            {t.back}
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
            {enabled ? t.active : t.inactive}
          </Badge>
          <Button
            size="sm"
            className="ml-auto"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            <Save className="mr-1 size-4" />
            {saving ? t.saving : t.save}
          </Button>
        </div>

        {/* Card 1 — Regelinformation (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.cardInfoTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{t.labelRuleId}</dt>
                <dd className="text-sm font-medium font-brand">
                  {rule.rule_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.labelRuleType}</dt>
                <dd className="text-sm font-medium">
                  {RULE_TYPE_LABELS[rule.rule_type] || rule.rule_type}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.labelTier}</dt>
                <dd className="text-sm font-medium">
                  {rule.tier === 1 ? t.tierStandard : t.tierAI}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t.labelDefaultSeverity}
                </dt>
                <dd className="text-sm font-medium">
                  {rule.default_severity === "error" ? t.severityError : t.severityWarning}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Card 2 — Regelkonfiguration (editable) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.cardConfigTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="rule-description">{t.description}</Label>
              <Textarea
                id="rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            {/* Document types */}
            <div className="space-y-2">
              <Label>{t.documentTypes}</Label>
              <p className="text-xs text-muted-foreground">
                {t.documentTypesHelp}
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
                                ? [...prev.filter((ty) => ty !== "all"), value]
                                : prev.filter((ty) => ty !== value),
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
                  {t.atLeastOneDocType}
                </p>
              )}
            </div>

            {/* Parent rule */}
            <div className="space-y-1.5">
              <Label>{t.parentRule}</Label>
              <Select value={parentRuleId} onValueChange={setParentRuleId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>
                    {t.noneStandalone}
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
            <CardTitle className="text-base">{t.cardSettingsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">{t.name}</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t.active}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.activeHelp}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.severityLabel}</Label>
                <Select
                  value={severityOverride}
                  onValueChange={setSeverityOverride}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      {t.severityDefault} (
                      {rule.default_severity === "error" ? t.severityError : t.severityWarning})
                    </SelectItem>
                    <SelectItem value="error">{t.severityError}</SelectItem>
                    <SelectItem value="warning">{t.severityWarning}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max-deduction">{t.maxDeduction}</Label>
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
              <Label htmlFor="remediation">{t.remediation}</Label>
              <Textarea
                id="remediation"
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                rows={3}
                placeholder={t.remediationPlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 — Historik */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noHistory}</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="border-l-2 border-muted pl-4 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={entry.action === "created" ? "default" : "secondary"} className="text-[10px] h-5">
                        {entry.action === "created" ? t.actionCreated : t.actionUpdated}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.changed_by}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleString(t.locale)}
                      </span>
                    </div>
                    {entry.action === "updated" && entry.old_values && (
                      <DiffView oldValues={entry.old_values} newValues={entry.new_values} t={t} />
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
            {saving ? t.saving : t.saveChanges}
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
  t,
}: {
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  t: T;
}) {
  const changedFields = Object.keys(newValues).filter(
    (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]),
  );

  if (changedFields.length === 0) {
    return <p className="text-xs text-muted-foreground">{t.noVisibleChanges}</p>;
  }

  return (
    <div className="space-y-1 text-xs">
      {changedFields.map((key) => (
        <div key={key} className="flex flex-wrap gap-1">
          <span className="font-medium">{t.fieldLabels[key] || key}:</span>
          <span className="line-through text-red-600">{formatValue(oldValues[key], t)}</span>
          <span className="text-green-600">{formatValue(newValues[key], t)}</span>
        </div>
      ))}
    </div>
  );
}

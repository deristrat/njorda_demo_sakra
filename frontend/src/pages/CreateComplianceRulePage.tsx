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
import { useLanguage, type Lang } from "@/lib/language";
import type { ComplianceRuleConfig } from "@/types";
import { toast } from "sonner";
import {
  CATEGORY_LABELS_BY_LANG,
  RULE_TYPE_LABELS_BY_LANG,
  getDocTypeOptions,
  RuleParamsEditor,
} from "@/components/compliance/RuleParamsEditor";

const NO_PARENT = "__none__";

const translations = {
  sv: {
    pageTitle: "Ny regel — Säkra",
    headerTitle: "Ny regel",
    somethingWentWrong: "Något gick fel",
    ruleCreated: "Regeln har skapats",
    couldNotCreate: "Kunde inte skapa regeln",
    back: "Tillbaka",
    basicInfoTitle: "Grundinformation",
    ruleId: "Regel-ID",
    ruleIdPlaceholder: "t.ex. KYC_015",
    name: "Namn",
    namePlaceholder: "t.ex. Kontrollera riskprofil",
    category: "Kategori",
    categoryPlaceholder: "Välj kategori...",
    ruleType: "Regeltyp",
    ruleTypePlaceholder: "Välj regeltyp...",
    defaultSeverity: "Standardallvarlighet",
    severityWarning: "Varning",
    severityError: "Fel",
    tier: "Nivå",
    tierStandard: "Standard (Tier 1)",
    tierAI: "AI (Tier 2)",
    configTitle: "Konfiguration",
    description: "Beskrivning",
    descriptionPlaceholder: "Beskriv vad regeln kontrollerar...",
    documentTypes: "Dokumenttyper",
    atLeastOneDocType: "Minst en dokumenttyp måste vara vald",
    parentRule: "Överordnad regel",
    selectPlaceholder: "Välj...",
    noneStandalone: "Ingen (fristående)",
    settingsTitle: "Inställningar",
    active: "Aktiv",
    activeHelp: "Inaktiva regler körs inte vid granskning",
    maxDeduction: "Maxpoäng (avdrag)",
    remediation: "Åtgärdsförslag",
    remediationPlaceholder: "Beskriv hur regeln kan åtgärdas vid avvikelse...",
    creating: "Skapar...",
    create: "Skapa regel",
  },
  en: {
    pageTitle: "New rule — Säkra",
    headerTitle: "New rule",
    somethingWentWrong: "Something went wrong",
    ruleCreated: "Rule created",
    couldNotCreate: "Could not create rule",
    back: "Back",
    basicInfoTitle: "Basic information",
    ruleId: "Rule ID",
    ruleIdPlaceholder: "e.g. KYC_015",
    name: "Name",
    namePlaceholder: "e.g. Check risk profile",
    category: "Category",
    categoryPlaceholder: "Select category…",
    ruleType: "Rule type",
    ruleTypePlaceholder: "Select rule type…",
    defaultSeverity: "Default severity",
    severityWarning: "Warning",
    severityError: "Error",
    tier: "Tier",
    tierStandard: "Standard (Tier 1)",
    tierAI: "AI (Tier 2)",
    configTitle: "Configuration",
    description: "Description",
    descriptionPlaceholder: "Describe what the rule checks…",
    documentTypes: "Document types",
    atLeastOneDocType: "At least one document type must be selected",
    parentRule: "Parent rule",
    selectPlaceholder: "Select…",
    noneStandalone: "None (standalone)",
    settingsTitle: "Settings",
    active: "Active",
    activeHelp: "Inactive rules are not run during review",
    maxDeduction: "Max deduction",
    remediation: "Remediation",
    remediationPlaceholder: "Describe how the rule can be remediated when violated…",
    creating: "Creating…",
    create: "Create rule",
  },
} satisfies Record<Lang, Record<string, string>>;

export function CreateComplianceRulePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  const CATEGORY_OPTIONS = useMemo(
    () => Object.entries(CATEGORY_LABELS_BY_LANG[lang]),
    [lang],
  );
  const RULE_TYPE_OPTIONS = useMemo(
    () => Object.entries(RULE_TYPE_LABELS_BY_LANG[lang]),
    [lang],
  );
  const DOC_TYPE_OPTIONS = useMemo(() => getDocTypeOptions(lang), [lang]);

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
    document.title = t.pageTitle;
    fetchComplianceRules().then(setAllRules).catch((e) => toast.error(e instanceof Error ? e.message : t.somethingWentWrong));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.pageTitle]);

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
      toast.success(t.ruleCreated);
      navigate(`/settings/compliance/${ruleId.trim()}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.couldNotCreate;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings/compliance")}
          >
            <ArrowLeft className="mr-1 size-4" />
            {t.back}
          </Button>
        </div>

        {/* Card 1 — Grundinformation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.basicInfoTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-rule-id">{t.ruleId}</Label>
                <Input
                  id="new-rule-id"
                  value={ruleId}
                  onChange={(e) => setRuleId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder={t.ruleIdPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-rule-name">{t.name}</Label>
                <Input
                  id="new-rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.category}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t.ruleType}</Label>
                <Select value={ruleType} onValueChange={(v) => { setRuleType(v); setRuleParams({}); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t.ruleTypePlaceholder} />
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
                <Label>{t.defaultSeverity}</Label>
                <Select value={defaultSeverity} onValueChange={setDefaultSeverity}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">{t.severityWarning}</SelectItem>
                    <SelectItem value="error">{t.severityError}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t.tier}</Label>
                <Select value={String(tier)} onValueChange={(v) => setTier(Number(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t.tierStandard}</SelectItem>
                    <SelectItem value="2">{t.tierAI}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Konfiguration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.configTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-rule-description">{t.description}</Label>
              <Textarea
                id="new-rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            {/* Document types */}
            <div className="space-y-2">
              <Label>{t.documentTypes}</Label>
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
              {documentTypes.length === 0 && (
                <p className="text-xs text-destructive">{t.atLeastOneDocType}</p>
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
                  <SelectItem value={NO_PARENT}>{t.noneStandalone}</SelectItem>
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
            <CardTitle className="text-base">{t.settingsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.active}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.activeHelp}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-max-deduction">{t.maxDeduction}</Label>
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
              <Label htmlFor="new-remediation">{t.remediation}</Label>
              <Textarea
                id="new-remediation"
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                rows={3}
                placeholder={t.remediationPlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={!canSave || saving}>
            <Plus className="mr-1 size-4" />
            {saving ? t.creating : t.create}
          </Button>
        </div>
      </div>
    </>
  );
}

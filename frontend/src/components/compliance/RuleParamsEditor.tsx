import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, type Lang } from "@/lib/language";

export const DOC_TYPE_LABELS_BY_LANG: Record<Lang, Record<string, string>> = {
  sv: {
    all: "Alla",
    investment_advice: "Rådgivning",
    pension_transfer: "Pensionsflytt",
    suitability_assessment: "Lämplighetsbedömning",
    insurance_advice: "Försäkring",
  },
  en: {
    all: "All",
    investment_advice: "Advice",
    pension_transfer: "Pension transfer",
    suitability_assessment: "Suitability assessment",
    insurance_advice: "Insurance",
  },
};

/** @deprecated Kept for backwards compatibility — defaults to Swedish. Prefer DOC_TYPE_LABELS_BY_LANG. */
export const DOC_TYPE_LABELS: Record<string, string> = DOC_TYPE_LABELS_BY_LANG.sv;

export function getDocTypeOptions(lang: Lang): [string, string][] {
  return Object.entries(DOC_TYPE_LABELS_BY_LANG[lang]);
}

/** @deprecated Kept for backwards compatibility — defaults to Swedish. Prefer getDocTypeOptions(lang). */
export const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS_BY_LANG.sv);

export const CATEGORY_LABELS_BY_LANG: Record<Lang, Record<string, string>> = {
  sv: {
    metadata: "Metadata",
    kyc: "KYC / Lämplighetsbedömning",
    recommendations: "Rekommendationer",
    transfer: "Pensionsflytt",
    esg: "Hållbarhet (ESG)",
    suitability_quality: "Kvalitetsbedömning",
    costs: "Kostnader & Ersättning",
  },
  en: {
    metadata: "Metadata",
    kyc: "KYC / Suitability assessment",
    recommendations: "Recommendations",
    transfer: "Pension transfer",
    esg: "Sustainability (ESG)",
    suitability_quality: "Quality assessment",
    costs: "Costs & Compensation",
  },
};

/** @deprecated Kept for backwards compatibility — defaults to Swedish. Prefer CATEGORY_LABELS_BY_LANG. */
export const CATEGORY_LABELS: Record<string, string> = CATEGORY_LABELS_BY_LANG.sv;

export const RULE_TYPE_LABELS_BY_LANG: Record<Lang, Record<string, string>> = {
  sv: {
    field_present: "Fält finns",
    field_not_empty: "Fält ej tomt",
    field_matches: "Fält matchar",
    require_field: "Fält krävs",
    require_any_items: "Poster krävs",
    require_field_on_items: "Fält krävs på poster",
    ai_evaluate: "AI-granskning",
    custom: "Anpassad",
    llm_check: "AI-granskning",
    composite: "Sammansatt",
  },
  en: {
    field_present: "Field exists",
    field_not_empty: "Field not empty",
    field_matches: "Field matches",
    require_field: "Field required",
    require_any_items: "Items required",
    require_field_on_items: "Field required on items",
    ai_evaluate: "AI review",
    custom: "Custom",
    llm_check: "AI review",
    composite: "Composite",
  },
};

/** @deprecated Kept for backwards compatibility — defaults to Swedish. Prefer RULE_TYPE_LABELS_BY_LANG. */
export const RULE_TYPE_LABELS: Record<string, string> = RULE_TYPE_LABELS_BY_LANG.sv;

const CONTEXT_FIELD_OPTIONS_BY_LANG: Record<Lang, { value: string; label: string }[]> = {
  sv: [
    { value: "client", label: "Klientinformation" },
    { value: "advisor", label: "Rådgivarinformation" },
    { value: "suitability", label: "Lämplighetsbedömning" },
    { value: "recommendations", label: "Rekommendationer" },
    { value: "pension_provider_from", label: "Pensionsleverantör (från)" },
    { value: "pension_provider_to", label: "Pensionsleverantör (till)" },
    { value: "transfer_amount", label: "Överföringsbelopp" },
    { value: "document_type", label: "Dokumenttyp" },
    { value: "document_date", label: "Dokumentdatum" },
    { value: "raw_data", label: "Raw data" },
    { value: "confidence_notes", label: "Konfidensnoteringar" },
  ],
  en: [
    { value: "client", label: "Client information" },
    { value: "advisor", label: "Advisor information" },
    { value: "suitability", label: "Suitability assessment" },
    { value: "recommendations", label: "Recommendations" },
    { value: "pension_provider_from", label: "Pension provider (from)" },
    { value: "pension_provider_to", label: "Pension provider (to)" },
    { value: "transfer_amount", label: "Transfer amount" },
    { value: "document_type", label: "Document type" },
    { value: "document_date", label: "Document date" },
    { value: "raw_data", label: "Raw data" },
    { value: "confidence_notes", label: "Confidence notes" },
  ],
};

/** @deprecated Kept for backwards compatibility. Prefer CONTEXT_FIELD_OPTIONS_BY_LANG. */
export const CONTEXT_FIELD_OPTIONS = CONTEXT_FIELD_OPTIONS_BY_LANG.sv;

const translations = {
  sv: {
    fieldPath: "Fältsökväg",
    fieldPathRequired: "Fältsökväg krävs",
    fieldPathPlaceholder: "t.ex. suitability.risk_profile",
    listPath: "Listsökväg",
    listPathRequired: "Listsökväg krävs",
    listPathPlaceholder: "t.ex. recommendations",
    itemField: "Postfält",
    itemFieldRequired: "Postfält krävs",
    itemFieldPlaceholder: "t.ex. motivation",
    aiPrompt: "AI-prompt",
    aiPromptRequired: "Prompt krävs",
    aiPromptPlaceholder: "Beskriv vad AI:n ska utvärdera...",
    contextFields: "Kontextfält",
    contextFieldsHelp:
      "Välj vilka fält som ska skickas som kontext till AI-utvärderingen",
    functionName: "Funktionsnamn",
    functionNameRequired: "Funktionsnamn krävs",
    functionNamePlaceholder: "t.ex. check_pension_transfer_complete",
    ruleParams: "Regelparametrar",
  },
  en: {
    fieldPath: "Field path",
    fieldPathRequired: "Field path is required",
    fieldPathPlaceholder: "e.g. suitability.risk_profile",
    listPath: "List path",
    listPathRequired: "List path is required",
    listPathPlaceholder: "e.g. recommendations",
    itemField: "Item field",
    itemFieldRequired: "Item field is required",
    itemFieldPlaceholder: "e.g. motivation",
    aiPrompt: "AI prompt",
    aiPromptRequired: "Prompt is required",
    aiPromptPlaceholder: "Describe what the AI should evaluate…",
    contextFields: "Context fields",
    contextFieldsHelp:
      "Select which fields are sent as context to the AI evaluation",
    functionName: "Function name",
    functionNameRequired: "Function name is required",
    functionNamePlaceholder: "e.g. check_pension_transfer_complete",
    ruleParams: "Rule parameters",
  },
} satisfies Record<Lang, Record<string, string>>;

export function RuleParamsEditor({
  ruleType,
  params,
  onChange,
}: {
  ruleType: string;
  params: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const { lang } = useLanguage();
  const t = translations[lang];
  const contextFieldOptions = CONTEXT_FIELD_OPTIONS_BY_LANG[lang];

  const set = (key: string, value: unknown) =>
    onChange({ ...params, [key]: value });

  if (ruleType === "require_field" || ruleType === "require_any_items") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="param-field-path">
          {t.fieldPath}{" "}
          <span className="font-normal text-muted-foreground">(field_path)</span>
        </Label>
        <Input
          id="param-field-path"
          value={(params.field_path as string) || ""}
          onChange={(e) => set("field_path", e.target.value)}
          placeholder={t.fieldPathPlaceholder}
        />
        {!(params.field_path as string)?.trim() && (
          <p className="text-xs text-destructive">{t.fieldPathRequired}</p>
        )}
      </div>
    );
  }

  if (ruleType === "require_field_on_items") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="param-list-path">
            {t.listPath}{" "}
            <span className="font-normal text-muted-foreground">
              (list_path)
            </span>
          </Label>
          <Input
            id="param-list-path"
            value={(params.list_path as string) || ""}
            onChange={(e) => set("list_path", e.target.value)}
            placeholder={t.listPathPlaceholder}
          />
          {!(params.list_path as string)?.trim() && (
            <p className="text-xs text-destructive">{t.listPathRequired}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="param-item-field">
            {t.itemField}{" "}
            <span className="font-normal text-muted-foreground">
              (item_field)
            </span>
          </Label>
          <Input
            id="param-item-field"
            value={(params.item_field as string) || ""}
            onChange={(e) => set("item_field", e.target.value)}
            placeholder={t.itemFieldPlaceholder}
          />
          {!(params.item_field as string)?.trim() && (
            <p className="text-xs text-destructive">{t.itemFieldRequired}</p>
          )}
        </div>
      </div>
    );
  }

  if (ruleType === "ai_evaluate") {
    const contextFields = Array.isArray(params.context_fields)
      ? (params.context_fields as string[])
      : [];
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="param-prompt">{t.aiPrompt}</Label>
          <Textarea
            id="param-prompt"
            value={(params.prompt as string) || ""}
            onChange={(e) => set("prompt", e.target.value)}
            rows={5}
            placeholder={t.aiPromptPlaceholder}
          />
          {!(params.prompt as string)?.trim() && (
            <p className="text-xs text-destructive">{t.aiPromptRequired}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t.contextFields}</Label>
          <p className="text-xs text-muted-foreground">
            {t.contextFieldsHelp}
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2">
            {contextFieldOptions.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={contextFields.includes(value)}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...contextFields, value]
                      : contextFields.filter((f) => f !== value);
                    set("context_fields", next);
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (ruleType === "custom") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="param-function-name">
          {t.functionName}{" "}
          <span className="font-normal text-muted-foreground">
            (function_name)
          </span>
        </Label>
        <Input
          id="param-function-name"
          value={(params.function_name as string) || ""}
          onChange={(e) => set("function_name", e.target.value)}
          placeholder={t.functionNamePlaceholder}
        />
        {!(params.function_name as string)?.trim() && (
          <p className="text-xs text-destructive">{t.functionNameRequired}</p>
        )}
      </div>
    );
  }

  // Fallback for unknown rule types — show raw JSON
  if (Object.keys(params).length > 0) {
    return (
      <div className="space-y-1.5">
        <Label>{t.ruleParams}</Label>
        <pre className="text-sm font-brand bg-muted rounded-md px-3 py-2 whitespace-pre-wrap">
          {JSON.stringify(params, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
}

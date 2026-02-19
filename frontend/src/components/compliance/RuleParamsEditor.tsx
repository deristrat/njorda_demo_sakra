import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const DOC_TYPE_LABELS: Record<string, string> = {
  all: "Alla",
  investment_advice: "Rådgivning",
  pension_transfer: "Pensionsflytt",
  suitability_assessment: "Lämplighetsbedömning",
  insurance_advice: "Försäkring",
};

export const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS);

export const CATEGORY_LABELS: Record<string, string> = {
  metadata: "Metadata",
  kyc: "KYC / Lämplighetsbedömning",
  recommendations: "Rekommendationer",
  transfer: "Pensionsflytt",
  esg: "Hållbarhet (ESG)",
  suitability_quality: "Kvalitetsbedömning",
  costs: "Kostnader & Ersättning",
};

export const RULE_TYPE_LABELS: Record<string, string> = {
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
};

export const CONTEXT_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: "client", label: "Klientinformation" },
  { value: "advisor", label: "Rådgivarinformation" },
  { value: "suitability", label: "Lämplighetsbedömning" },
  { value: "recommendations", label: "Rekommendationer" },
  { value: "pension_provider_from", label: "Pensionsleverantör (från)" },
  { value: "pension_provider_to", label: "Pensionsleverantör (till)" },
  { value: "transfer_amount", label: "Överföringsbelopp" },
  { value: "document_type", label: "Dokumenttyp" },
  { value: "document_date", label: "Dokumentdatum" },
  { value: "raw_data", label: "Rådata" },
  { value: "confidence_notes", label: "Konfidensnoteringar" },
];

export function RuleParamsEditor({
  ruleType,
  params,
  onChange,
}: {
  ruleType: string;
  params: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) =>
    onChange({ ...params, [key]: value });

  if (ruleType === "require_field" || ruleType === "require_any_items") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="param-field-path">
          Fältsökväg{" "}
          <span className="font-normal text-muted-foreground">(field_path)</span>
        </Label>
        <Input
          id="param-field-path"
          value={(params.field_path as string) || ""}
          onChange={(e) => set("field_path", e.target.value)}
          placeholder="t.ex. suitability.risk_profile"
        />
        {!(params.field_path as string)?.trim() && (
          <p className="text-xs text-destructive">Fältsökväg krävs</p>
        )}
      </div>
    );
  }

  if (ruleType === "require_field_on_items") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="param-list-path">
            Listsökväg{" "}
            <span className="font-normal text-muted-foreground">
              (list_path)
            </span>
          </Label>
          <Input
            id="param-list-path"
            value={(params.list_path as string) || ""}
            onChange={(e) => set("list_path", e.target.value)}
            placeholder="t.ex. recommendations"
          />
          {!(params.list_path as string)?.trim() && (
            <p className="text-xs text-destructive">Listsökväg krävs</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="param-item-field">
            Postfält{" "}
            <span className="font-normal text-muted-foreground">
              (item_field)
            </span>
          </Label>
          <Input
            id="param-item-field"
            value={(params.item_field as string) || ""}
            onChange={(e) => set("item_field", e.target.value)}
            placeholder="t.ex. motivation"
          />
          {!(params.item_field as string)?.trim() && (
            <p className="text-xs text-destructive">Postfält krävs</p>
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
          <Label htmlFor="param-prompt">AI-prompt</Label>
          <Textarea
            id="param-prompt"
            value={(params.prompt as string) || ""}
            onChange={(e) => set("prompt", e.target.value)}
            rows={5}
            placeholder="Beskriv vad AI:n ska utvärdera..."
          />
          {!(params.prompt as string)?.trim() && (
            <p className="text-xs text-destructive">Prompt krävs</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Kontextfält</Label>
          <p className="text-xs text-muted-foreground">
            Välj vilka fält som ska skickas som kontext till AI-utvärderingen
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2">
            {CONTEXT_FIELD_OPTIONS.map(({ value, label }) => (
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
          Funktionsnamn{" "}
          <span className="font-normal text-muted-foreground">
            (function_name)
          </span>
        </Label>
        <Input
          id="param-function-name"
          value={(params.function_name as string) || ""}
          onChange={(e) => set("function_name", e.target.value)}
          placeholder="t.ex. check_pension_transfer_complete"
        />
        {!(params.function_name as string)?.trim() && (
          <p className="text-xs text-destructive">Funktionsnamn krävs</p>
        )}
      </div>
    );
  }

  // Fallback for unknown rule types — show raw JSON
  if (Object.keys(params).length > 0) {
    return (
      <div className="space-y-1.5">
        <Label>Regelparametrar</Label>
        <pre className="text-sm font-brand bg-muted rounded-md px-3 py-2 whitespace-pre-wrap">
          {JSON.stringify(params, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
}

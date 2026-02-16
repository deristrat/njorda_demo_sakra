import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  fetchComplianceThresholds,
  updateComplianceThresholds,
} from "@/lib/api";
import type { ComplianceRuleConfig } from "@/types";

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

const CATEGORY_ORDER = [
  "metadata",
  "kyc",
  "recommendations",
  "transfer",
  "esg",
  "suitability_quality",
  "costs",
];

export function ComplianceSettingsPage() {
  const [rules, setRules] = useState<ComplianceRuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState({ green: 85, yellow: 50 });
  const [savingThresholds, setSavingThresholds] = useState(false);

  useEffect(() => {
    document.title = "Regelefterlevnad — Njorda Advisor";
    Promise.all([fetchComplianceRules(), fetchComplianceThresholds()])
      .then(([ruleData, thresholdData]) => {
        setRules(ruleData);
        setThresholds(thresholdData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (ruleId: string, enabled: boolean) => {
    const updated = await updateComplianceRule(ruleId, { enabled });
    setRules((prev) =>
      prev.map((r) => (r.rule_id === ruleId ? { ...r, ...updated } : r)),
    );
  };

  const handleSeverityChange = async (ruleId: string, value: string) => {
    const severityOverride = value === "default" ? "default" : value;
    const updated = await updateComplianceRule(ruleId, {
      severity_override: severityOverride,
    });
    setRules((prev) =>
      prev.map((r) => (r.rule_id === ruleId ? { ...r, ...updated } : r)),
    );
  };

  const handleThresholdChange = async (
    field: "green" | "yellow",
    value: string,
  ) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 100) return;
    const updated = { ...thresholds, [field]: num };
    setThresholds(updated);
    setSavingThresholds(true);
    try {
      await updateComplianceThresholds({ [field]: num });
    } finally {
      setSavingThresholds(false);
    }
  };

  // Group rules by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    rules: rules.filter((r) => r.category === cat),
  })).filter((g) => g.rules.length > 0);

  if (loading) {
    return (
      <>
        <AppHeader title="Regelefterlevnad" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full max-w-2xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Regelefterlevnad" />
      <div className="p-6 space-y-6">
        {/* Thresholds */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Tröskelvärden</CardTitle>
            <CardDescription>
              Poänggränser för trafikljusindikering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-500" />
                  Grön (godkänd) ≥
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholds.green}
                  onChange={(e) => handleThresholdChange("green", e.target.value)}
                  className="w-20"
                  disabled={savingThresholds}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-amber-400" />
                  Gul (varning) ≥
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholds.yellow}
                  onChange={(e) =>
                    handleThresholdChange("yellow", e.target.value)
                  }
                  className="w-20"
                  disabled={savingThresholds}
                />
              </div>
              <div className="space-y-2 pt-6">
                <p className="text-xs text-muted-foreground">
                  Under {thresholds.yellow} ={" "}
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-full bg-red-500" /> Röd
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules table */}
        <Card>
          <CardHeader>
            <CardTitle>Regler</CardTitle>
            <CardDescription>
              {rules.length} regler — {rules.filter((r) => r.enabled).length}{" "}
              aktiva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {grouped.map(({ category, label, rules: categoryRules }) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {label}
                  </h3>
                  <div className="rounded-lg border divide-y">
                    {categoryRules.map((rule) => (
                      <div
                        key={rule.rule_id}
                        className={`flex items-center gap-4 px-4 py-3 ${!rule.enabled ? "opacity-50" : ""}`}
                      >
                        {/* Rule name + info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {rule.name}
                            </span>
                            {rule.tier === 2 && (
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 text-[10px]"
                              >
                                <Sparkles className="mr-0.5 size-2.5" />
                                AI
                              </Badge>
                            )}
                            {rule.parent_rule_id && (
                              <span className="text-xs text-muted-foreground">
                                ← {rule.parent_rule_id}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(rule.document_types || [])
                              .map((t) => DOC_TYPE_LABELS[t] || t)
                              .join(", ")}
                            {" · "}
                            {rule.max_deduction}p
                          </p>
                        </div>

                        {/* Severity selector */}
                        <Select
                          value={
                            rule.severity_override || "default"
                          }
                          onValueChange={(v) =>
                            handleSeverityChange(rule.rule_id, v)
                          }
                        >
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              Standard (
                              {rule.default_severity === "error"
                                ? "Fel"
                                : "Varning"}
                              )
                            </SelectItem>
                            <SelectItem value="error">Fel</SelectItem>
                            <SelectItem value="warning">Varning</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Enable toggle */}
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) =>
                            handleToggle(rule.rule_id, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

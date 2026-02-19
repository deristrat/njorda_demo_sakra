import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CATEGORY_LABELS, DOC_TYPE_LABELS } from "@/components/compliance/RuleParamsEditor";

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
  const navigate = useNavigate();
  const [docTypeFilter, setDocTypeFilter] = useState("all_types");
  const [groupBy, setGroupBy] = useState<"category" | "hierarchy" | "none">("category");
  const [sortBy, setSortBy] = useState<"name" | "points">("name");

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

  const filteredRules =
    docTypeFilter === "all_types"
      ? rules
      : rules.filter(
          (r) =>
            r.document_types?.includes("all") ||
            r.document_types?.includes(docTypeFilter),
        );

  const sortFn = (a: ComplianceRuleConfig, b: ComplianceRuleConfig) =>
    sortBy === "points"
      ? b.max_deduction - a.max_deduction
      : a.name.localeCompare(b.name, "sv");

  const sortedRules = [...filteredRules].sort(sortFn);

  // Build hierarchy: parent rules contain their children, standalone rules are top-level
  const buildHierarchyGroups = () => {
    const parents = sortedRules.filter(
      (r) => !r.parent_rule_id && sortedRules.some((c) => c.parent_rule_id === r.rule_id),
    );
    const standalone = sortedRules.filter(
      (r) => !r.parent_rule_id && !sortedRules.some((c) => c.parent_rule_id === r.rule_id),
    );
    const groups: { category: string; label: string; parentRule: ComplianceRuleConfig | null; rules: ComplianceRuleConfig[] }[] = parents.map((p) => ({
      category: p.rule_id,
      label: p.name,
      parentRule: p as ComplianceRuleConfig | null,
      rules: sortedRules.filter((r) => r.parent_rule_id === p.rule_id),
    }));
    if (standalone.length > 0) {
      groups.push({
        category: "_standalone",
        label: "Fristående regler",
        parentRule: null as ComplianceRuleConfig | null,
        rules: standalone,
      });
    }
    return groups;
  };

  const grouped =
    groupBy === "category"
      ? CATEGORY_ORDER.map((cat) => ({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          parentRule: null as ComplianceRuleConfig | null,
          rules: sortedRules.filter((r) => r.category === cat),
        })).filter((g) => g.rules.length > 0)
      : groupBy === "hierarchy"
        ? buildHierarchyGroups()
        : [{ category: "_all", label: "", parentRule: null as ComplianceRuleConfig | null, rules: sortedRules }];

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
            <div className="flex items-center justify-between">
              <CardTitle>Regler</CardTitle>
              <Button size="sm" onClick={() => navigate("/settings/compliance/new")}>
                <Plus className="mr-1 size-4" />
                Ny regel
              </Button>
            </div>
            <CardDescription>
              {filteredRules.length} regler — {filteredRules.filter((r) => r.enabled).length}{" "}
              aktiva
              {docTypeFilter !== "all_types" && ` (filtrerat från ${rules.length})`}
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-4 flex gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dokumenttyp</Label>
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">Alla dokumenttyper</SelectItem>
                  {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Gruppering</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "category" | "hierarchy" | "none")}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Kategori</SelectItem>
                  <SelectItem value="hierarchy">Hierarki</SelectItem>
                  <SelectItem value="none">Ingen gruppering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sortering</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "points")}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Namn</SelectItem>
                  <SelectItem value="points">Poäng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardContent>
            <div className="space-y-6">
              {grouped.map(({ category, label, parentRule, rules: categoryRules }) => (
                <div key={category}>
                  {groupBy !== "none" && (
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {label}
                      {groupBy === "hierarchy" && parentRule && (
                        <span className="ml-2 font-normal text-xs">
                          ({parentRule.rule_id} · {parentRule.max_deduction}p)
                        </span>
                      )}
                    </h3>
                  )}
                  <div className="rounded-lg border divide-y">
                    {groupBy === "hierarchy" && parentRule && (
                      <div
                        className={`flex items-center gap-4 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors ${!parentRule.enabled ? "opacity-50" : ""}`}
                      >
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/settings/compliance/${parentRule.rule_id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold hover:underline">
                              {parentRule.name}
                            </span>
                            {parentRule.tier === 2 && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                <Sparkles className="mr-0.5 size-2.5" />
                                AI
                              </Badge>
                            )}
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                              Överordnad
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(parentRule.document_types || [])
                              .map((t) => DOC_TYPE_LABELS[t] || t)
                              .join(", ")}
                            {" · "}
                            {parentRule.max_deduction}p
                          </p>
                        </div>
                        <Select
                          value={parentRule.severity_override || "default"}
                          onValueChange={(v) => handleSeverityChange(parentRule.rule_id, v)}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              Standard ({parentRule.default_severity === "error" ? "Fel" : "Varning"})
                            </SelectItem>
                            <SelectItem value="error">Fel</SelectItem>
                            <SelectItem value="warning">Varning</SelectItem>
                          </SelectContent>
                        </Select>
                        <Switch
                          checked={parentRule.enabled}
                          onCheckedChange={(checked) => handleToggle(parentRule.rule_id, checked)}
                        />
                      </div>
                    )}
                    {categoryRules.map((rule) => (
                      <div
                        key={rule.rule_id}
                        className={`flex items-center gap-4 py-3 hover:bg-muted/50 transition-colors ${groupBy === "hierarchy" && parentRule ? "pl-8 pr-4" : "px-4"} ${!rule.enabled ? "opacity-50" : ""}`}
                      >
                        {/* Rule name + info */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => navigate(`/settings/compliance/${rule.rule_id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium hover:underline">
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
                            {rule.parent_rule_id && groupBy !== "hierarchy" && (
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

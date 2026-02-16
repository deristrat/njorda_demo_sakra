import { CircleCheck, CircleAlert, CircleX, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ComplianceSummaryData } from "@/types";

interface ComplianceStatusBadgeProps {
  status: string | null;
  score: number | null;
  summary?: ComplianceSummaryData | null;
}

export function ComplianceStatusBadge({
  status,
  score,
  summary,
}: ComplianceStatusBadgeProps) {
  if (!status || score === null) {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Minus className="size-4" />
        <span className="text-sm">—</span>
      </span>
    );
  }

  const Icon =
    status === "green"
      ? CircleCheck
      : status === "yellow"
        ? CircleAlert
        : CircleX;

  const colorClass =
    status === "green"
      ? "text-emerald-600"
      : status === "yellow"
        ? "text-amber-500"
        : "text-red-500";

  const tooltipText = summary
    ? `${summary.failed} av ${summary.total_rules} flaggade (${summary.errors} fel, ${summary.warnings} varningar)`
    : undefined;

  const badge = (
    <span className={`flex items-center gap-1.5 ${colorClass}`}>
      <Icon className="size-4" />
      <span className="text-sm font-brand font-medium">{score}</span>
    </span>
  );

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

import {
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Star,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { KPI } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Users,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Star,
  AlertCircle,
};

export function KPICard({ label, value, trend, icon }: KPI) {
  const Icon = iconMap[icon] ?? TrendingUp;
  const isPositive = trend >= 0;

  return (
    <Card>
      <CardContent className="px-4 py-2.5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <Icon className="size-4 text-muted-foreground/50" />
        </div>
        <p className="mt-1 font-brand text-xl font-semibold tracking-tight">
          {value}
        </p>
        <div
          className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${
            isPositive ? "text-[#03A48D]" : "text-[#FC4832]"
          }`}
        >
          {isPositive ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )}
          {isPositive ? "+" : ""}
          {Math.abs(trend)}%
        </div>
      </CardContent>
    </Card>
  );
}

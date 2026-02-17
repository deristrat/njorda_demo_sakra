import { Info, Lightbulb, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocsCalloutProps {
  variant: "info" | "tip" | "warning";
  title?: string;
  children: React.ReactNode;
}

const variantConfig = {
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    textColor: "text-blue-900/80",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-primary/5",
    border: "border-primary/20",
    iconColor: "text-primary",
    titleColor: "text-primary",
    textColor: "text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    textColor: "text-amber-900/80",
  },
};

export function DocsCallout({ variant, title, children }: DocsCalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 my-4",
        config.bg,
        config.border,
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("size-5 shrink-0 mt-0.5", config.iconColor)} />
        <div className="min-w-0">
          {title && (
            <p className={cn("text-base font-medium mb-1", config.titleColor)}>
              {title}
            </p>
          )}
          <div className={cn("text-[15px] leading-[1.7] [&>p]:mb-2 [&>p:last-child]:mb-0", config.textColor)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

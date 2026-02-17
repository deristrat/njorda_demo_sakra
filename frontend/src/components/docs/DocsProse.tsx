import { cn } from "@/lib/utils";

interface DocsProseProps {
  children: React.ReactNode;
  className?: string;
}

export function DocsProse({ children, className }: DocsProseProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        "[&>h2]:font-brand [&>h2]:text-2xl [&>h2]:tracking-tight [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:first:mt-0",
        "[&>h3]:font-brand [&>h3]:text-lg [&>h3]:tracking-tight [&>h3]:mt-8 [&>h3]:mb-3",
        "[&>p]:text-base [&>p]:leading-relaxed [&>p]:text-foreground/80 [&>p]:mb-4",
        "[&>ul]:text-base [&>ul]:leading-relaxed [&>ul]:text-foreground/80 [&>ul]:mb-4 [&>ul]:ml-4 [&>ul]:list-disc [&>ul]:space-y-1.5",
        "[&>ol]:text-base [&>ol]:leading-relaxed [&>ol]:text-foreground/80 [&>ol]:mb-4 [&>ol]:ml-4 [&>ol]:list-decimal [&>ol]:space-y-1.5",
        "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-brand",
        className,
      )}
    >
      {children}
    </div>
  );
}

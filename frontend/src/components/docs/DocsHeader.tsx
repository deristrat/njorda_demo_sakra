import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface DocsHeaderProps {
  title: string;
}

export function DocsHeader({ title }: DocsHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <h1 className="font-brand text-base tracking-tight">{title}</h1>
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => window.open("/", "_self")}
        >
          <ArrowLeft className="size-4" />
          Tillbaka till appen
        </Button>
      </div>
    </header>
  );
}

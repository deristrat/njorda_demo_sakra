import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useLanguage, type Lang } from "@/lib/language";

interface DocsHeaderProps {
  title: string;
}

const translations = {
  sv: {
    backToApp: "Tillbaka till appen",
  },
  en: {
    backToApp: "Back to the app",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DocsHeader({ title }: DocsHeaderProps) {
  const { lang } = useLanguage();
  const t = translations[lang];

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
          {t.backToApp}
        </Button>
      </div>
    </header>
  );
}

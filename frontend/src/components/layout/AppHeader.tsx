import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="flex h-10 items-center gap-3 border-b border-border bg-card px-3">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <h1 className="font-brand text-base tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open("/docs", "_blank")}
        >
          <HelpCircle className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            toast.info("Inga nya notifieringar")
          }
        >
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}

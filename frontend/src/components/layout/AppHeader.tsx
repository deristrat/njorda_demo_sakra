import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <h1 className="font-brand text-base tracking-tight">{title}</h1>
      <div className="ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            toast.info("Du har 3 olästa notifieringar", {
              description: "Klicka för att visa alla",
            })
          }
        >
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}

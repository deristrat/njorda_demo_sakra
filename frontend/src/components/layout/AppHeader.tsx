import { useEffect, useState } from "react";
import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { fetchUnreadCount } from "@/lib/api";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

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
          className="relative"
          onClick={() => setSheetOpen(true)}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-[50vw] w-[50vw] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle>Meddelanden</SheetTitle>
            <SheetDescription className="sr-only">
              Lista över meddelanden
            </SheetDescription>
          </SheetHeader>
          <NotificationPanel onUnreadCountChange={setUnreadCount} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

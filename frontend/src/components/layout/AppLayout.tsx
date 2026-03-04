import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  njorda_admin: "Admin",
  compliance: "Compliance",
  advisor: "Rådgivare",
};

function ImpersonationBanner() {
  const { isImpersonating, impersonatingAs, stopImpersonation } = useAuth();

  if (!isImpersonating || !impersonatingAs) return null;

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900">
      <span>
        Du ser appen som:{" "}
        <strong>{impersonatingAs.name}</strong>{" "}
        ({ROLE_LABELS[impersonatingAs.role] || impersonatingAs.role})
      </span>
      <button
        onClick={stopImpersonation}
        className="rounded bg-amber-200 px-3 py-1 text-xs font-medium hover:bg-amber-300 transition-colors"
      >
        Avsluta
      </button>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="max-h-dvh overflow-hidden">
        <ImpersonationBanner />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

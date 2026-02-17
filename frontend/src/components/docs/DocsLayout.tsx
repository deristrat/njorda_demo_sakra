import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DocsSidebar } from "./DocsSidebar";

export function DocsLayout() {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset className="font-docs">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

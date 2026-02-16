import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Upload,
  FileText,
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NjordaLogo } from "./NjordaLogo";

const mainNav = [
  { label: "Ladda upp", icon: Upload, path: "/" },
  { label: "Dokument", icon: FileText, path: "/documents" },
  { label: "Regelefterlevnad", icon: ShieldCheck, path: "/settings/compliance" },
  { label: "Inställningar", icon: Settings, path: "/settings" },
];

const exampleNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/examples/dashboard" },
  { label: "Klienter", icon: Users, path: "/examples/clients" },
  { label: "Inställningar", icon: Settings, path: "/examples/settings" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [examplesOpen, setExamplesOpen] = useState(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NjordaLogo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : item.path === "/settings"
                      ? location.pathname === "/settings"
                      : location.pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(item.path)}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={examplesOpen} onOpenChange={setExamplesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer select-none">
                <ChevronRight
                  className={`size-3 mr-1 transition-transform duration-200 ${examplesOpen ? "rotate-90" : ""}`}
                />
                UI Examples
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {exampleNav.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        tooltip={item.label}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    DA
                  </div>
                  <span className="truncate">Daniel Advisor</span>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  <LogOut className="mr-2 size-4" />
                  Logga ut
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

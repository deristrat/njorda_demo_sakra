import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Upload,
  FileText,
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronUp,
  ChevronRight,
  BookOpen,
  UserCog,
  Home,
  ClipboardList,
  BarChart3,
  FileBarChart,
  Inbox,
  Archive,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NjordaLogo } from "./NjordaLogo";
import { useAuth } from "@/lib/auth";
import { fetchUsers, type AppUser } from "@/lib/api";
import { getDefaultPath } from "@/lib/navigation";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface NavSubMenu {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

function getNavItems(role: UserRole | null): NavItem[] {
  switch (role) {
    case "compliance":
      return [
        { label: "Start", icon: Home, path: "/start" },
        { label: "Rådgivare", icon: Briefcase, path: "/advisors" },
        { label: "Alla dokument", icon: FileText, path: "/documents" },
        { label: "Regelmotor", icon: ShieldCheck, path: "/settings/compliance" },
        { label: "Audit", icon: ClipboardList, path: "/audit" },
      ];
    case "advisor":
      return [
        { label: "Start", icon: Home, path: "/start" },
        { label: "Inkorg", icon: Inbox, path: "/inbox" },
        { label: "Arkiv", icon: Archive, path: "/archive" },
        { label: "Klienter", icon: Users, path: "/clients" },
      ];
    case "njorda_admin":
      return [
        { label: "Start", icon: Home, path: "/start" },
        { label: "Inkorg", icon: Inbox, path: "/inbox" },
        { label: "Arkiv", icon: Archive, path: "/archive" },
        { label: "Alla dokument", icon: FileText, path: "/documents" },
        { label: "Klienter", icon: Users, path: "/clients" },
        { label: "Rådgivare", icon: Briefcase, path: "/advisors" },
        { label: "Regelmotor", icon: ShieldCheck, path: "/settings/compliance" },
        { label: "Audit", icon: ClipboardList, path: "/audit" },
        { label: "Inställningar", icon: Settings, path: "/settings" },
      ];
    default:
      return [];
  }
}

function getSubMenus(role: UserRole | null): NavSubMenu[] {
  if (role === "compliance" || role === "njorda_admin") {
    return [
      {
        label: "Rapporter",
        icon: BarChart3,
        items: [
          { label: "Compliance rapport", icon: FileBarChart, path: "/reports/compliance" },
        ],
      },
    ];
  }
  return [];
}

const exampleNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/examples/dashboard" },
  { label: "Klienter", icon: Users, path: "/examples/clients" },
  { label: "Inställningar", icon: Settings, path: "/examples/settings" },
];

const ROLE_LABELS: Record<string, string> = {
  njorda_admin: "Admin",
  compliance: "Compliance",
  advisor: "Rådgivare",
};

const ROLE_COLORS: Record<string, string> = {
  njorda_admin: "bg-violet-100 text-violet-700",
  compliance: "bg-blue-100 text-blue-700",
  advisor: "bg-emerald-100 text-emerald-700",
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState<Record<string, boolean>>({});
  const {
    username, name: authName, role, effectiveRole,
    isImpersonating, impersonatingAs,
    logout, startImpersonation, stopImpersonation,
  } = useAuth();

  // Determine display name/initials based on impersonation
  const displayName = isImpersonating && impersonatingAs
    ? impersonatingAs.name
    : authName || username || "Användare";
  const initials = displayName.slice(0, 2).toUpperCase();

  // Role-based navigation
  const navItems = getNavItems(effectiveRole);
  const subMenus = getSubMenus(effectiveRole);

  // User switcher state (only for njorda_admin)
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const loadUsers = async () => {
    if (usersLoaded) return;
    try {
      const data = await fetchUsers();
      setUsers(data);
      setUsersLoaded(true);
    } catch { /* ignore */ }
  };

  const handleImpersonate = async (userId: number) => {
    try {
      const targetUser = users.find((u) => u.id === userId);
      await startImpersonation(userId);
      const targetRole = (targetUser?.role ?? "advisor") as UserRole;
      navigate(getDefaultPath(targetRole));
    } catch { /* ignore */ }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
      navigate(getDefaultPath(role));
    } catch { /* ignore */ }
  };

  // Group users by role for the switcher
  const usersByRole: Record<string, AppUser[]> = {};
  for (const u of users) {
    if (!usersByRole[u.role]) usersByRole[u.role] = [];
    usersByRole[u.role].push(u);
  }
  const roleOrder = ["njorda_admin", "compliance", "advisor"];

  const isItemActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/settings") return location.pathname === "/settings";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NjordaLogo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isItemActive(item.path)}
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
        </SidebarGroup>

        {/* Role-based submenus (e.g. Rapporter) */}
        {subMenus.map((menu) => {
          const isOpen = subMenuOpen[menu.label] ?? false;
          const hasActiveChild = menu.items.some((item) =>
            isItemActive(item.path),
          );
          return (
            <SidebarGroup key={menu.label}>
              <Collapsible
                open={isOpen || hasActiveChild}
                onOpenChange={(open) =>
                  setSubMenuOpen((prev) => ({ ...prev, [menu.label]: open }))
                }
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer select-none">
                    <ChevronRight
                      className={`size-3 mr-1 transition-transform duration-200 ${isOpen || hasActiveChild ? "rotate-90" : ""}`}
                    />
                    {menu.label}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {menu.items.map((item) => (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isItemActive(item.path)}
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
          );
        })}

        {effectiveRole === "njorda_admin" && (
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => window.open("/docs", "_blank")}
              tooltip="Dokumentation"
            >
              <BookOpen className="size-4" />
              <span>Dokumentation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* User switcher — only for real njorda_admin */}
          {role === "njorda_admin" && (
            <SidebarMenuItem>
              <DropdownMenu onOpenChange={(open) => { if (open) loadUsers(); }}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="Byt användare">
                    <UserCog className="size-4" />
                    <span>Byt användare</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-56">
                  {isImpersonating && (
                    <>
                      <DropdownMenuItem onClick={handleStopImpersonation}>
                        Tillbaka till Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {roleOrder.map((r) =>
                    usersByRole[r] ? (
                      <div key={r}>
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[r] || ""}`}>
                            {ROLE_LABELS[r] || r}
                          </Badge>
                        </DropdownMenuLabel>
                        {usersByRole[r].map((u) => (
                          <DropdownMenuItem
                            key={u.id}
                            onClick={() => handleImpersonate(u.id)}
                          >
                            <span className="truncate">{u.name || u.username}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{u.username}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : null
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}

          {/* User menu */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </div>
                  <span className="truncate">{displayName}</span>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-48">
                <DropdownMenuItem onClick={async () => { await logout(); navigate("/login"); }}>
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

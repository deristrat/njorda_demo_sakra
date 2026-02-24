import { useState, useEffect } from "react";
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
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: UserRole[];
}

const mainNav: NavItem[] = [
  { label: "Ladda upp", icon: Upload, path: "/", roles: ["advisor", "compliance", "njorda_admin"] },
  { label: "Dokument", icon: FileText, path: "/documents", roles: ["advisor", "compliance", "njorda_admin"] },
  { label: "Klienter", icon: Users, path: "/clients", roles: ["advisor", "compliance", "njorda_admin"] },
  { label: "Rådgivare", icon: Briefcase, path: "/advisors", roles: ["compliance", "njorda_admin"] },
  { label: "Regelefterlevnad", icon: ShieldCheck, path: "/settings/compliance", roles: ["compliance", "njorda_admin"] },
  { label: "Inställningar", icon: Settings, path: "/settings", roles: ["compliance", "njorda_admin"] },
];

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

  // Filter nav items by effective role
  const filteredNav = mainNav.filter(
    (item) => effectiveRole && item.roles.includes(effectiveRole)
  );

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
      await startImpersonation(userId);
      navigate("/");
    } catch { /* ignore */ }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
      navigate("/");
    } catch { /* ignore */ }
  };

  // Group users by role for the switcher
  const usersByRole: Record<string, AppUser[]> = {};
  for (const u of users) {
    if (!usersByRole[u.role]) usersByRole[u.role] = [];
    usersByRole[u.role].push(u);
  }
  const roleOrder = ["njorda_admin", "compliance", "advisor"];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NjordaLogo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => {
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

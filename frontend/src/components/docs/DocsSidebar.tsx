import { useLocation, useNavigate } from "react-router";
import {
  Home,
  Rocket,
  Upload,
  FileText,
  ShieldCheck,
  Calculator,
  MessageSquare,
  Sliders,
  BookOpen,
  HelpCircle,
  ArrowLeft,
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
import { NjordaLogo } from "@/components/layout/NjordaLogo";

const gettingStartedNav = [
  { label: "Hem", icon: Home, path: "/docs" },
  { label: "Kom igång", icon: Rocket, path: "/docs/kom-igang" },
];

const advisorNav = [
  { label: "Ladda upp dokument", icon: Upload, path: "/docs/ladda-upp" },
  { label: "Arbeta med dokument", icon: FileText, path: "/docs/dokument" },
  { label: "Regelefterlevnad", icon: ShieldCheck, path: "/docs/regelefterlevnad" },
  { label: "Poängsystem", icon: Calculator, path: "/docs/poangsystem" },
  { label: "Kommunikation", icon: MessageSquare, path: "/docs/kommunikation" },
];

const adminNav = [
  { label: "Konfiguration", icon: Sliders, path: "/docs/konfiguration" },
  { label: "Hantera regler", icon: BookOpen, path: "/docs/regler" },
];

const otherNav = [
  { label: "Vanliga frågor", icon: HelpCircle, path: "/docs/faq" },
];

function NavGroup({
  label,
  items,
  pathname,
  navigate,
}: {
  label: string;
  items: typeof gettingStartedNav;
  pathname: string;
  navigate: (path: string) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.path === "/docs"
                ? pathname === "/docs"
                : pathname.startsWith(item.path);
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
  );
}

export function DocsSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex flex-col gap-1">
          <NjordaLogo collapsed={collapsed} />
          {!collapsed && (
            <span className="text-xs text-muted-foreground pl-[42px]">
              Dokumentation
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup
          label="Komma igång"
          items={gettingStartedNav}
          pathname={location.pathname}
          navigate={navigate}
        />
        <NavGroup
          label="Rådgivare"
          items={advisorNav}
          pathname={location.pathname}
          navigate={navigate}
        />
        <NavGroup
          label="Administration"
          items={adminNav}
          pathname={location.pathname}
          navigate={navigate}
        />
        <NavGroup
          label="Övrigt"
          items={otherNav}
          pathname={location.pathname}
          navigate={navigate}
        />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => window.open("/", "_self")}
              tooltip="Tillbaka till appen"
            >
              <ArrowLeft className="size-4" />
              <span>Tillbaka till appen</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

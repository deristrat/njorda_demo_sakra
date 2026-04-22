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
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    docsLabel: "Dokumentation",
    groupGettingStarted: "Komma igång",
    groupAdvisor: "Rådgivare",
    groupAdmin: "Administration",
    groupOther: "Övrigt",
    home: "Hem",
    gettingStarted: "Kom igång",
    uploadDocuments: "Ladda upp dokument",
    workWithDocuments: "Arbeta med dokument",
    compliance: "Regelefterlevnad",
    scoring: "Poängsystem",
    communication: "Kommunikation",
    configuration: "Konfiguration",
    manageRules: "Hantera regler",
    faq: "Vanliga frågor",
    backToApp: "Tillbaka till appen",
  },
  en: {
    docsLabel: "Documentation",
    groupGettingStarted: "Getting started",
    groupAdvisor: "Advisor",
    groupAdmin: "Administration",
    groupOther: "Other",
    home: "Home",
    gettingStarted: "Getting started",
    uploadDocuments: "Upload documents",
    workWithDocuments: "Working with documents",
    compliance: "Compliance",
    scoring: "Scoring system",
    communication: "Communication",
    configuration: "Configuration",
    manageRules: "Manage rules",
    faq: "FAQ",
    backToApp: "Back to the app",
  },
} satisfies Record<Lang, Record<string, string>>;

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

function NavGroup({
  label,
  items,
  pathname,
  navigate,
}: {
  label: string;
  items: NavItem[];
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
  const { lang } = useLanguage();
  const t = translations[lang];

  const gettingStartedNav: NavItem[] = [
    { label: t.home, icon: Home, path: "/docs" },
    { label: t.gettingStarted, icon: Rocket, path: "/docs/kom-igang" },
  ];

  const advisorNav: NavItem[] = [
    { label: t.uploadDocuments, icon: Upload, path: "/docs/ladda-upp" },
    { label: t.workWithDocuments, icon: FileText, path: "/docs/dokument" },
    {
      label: t.compliance,
      icon: ShieldCheck,
      path: "/docs/regelefterlevnad",
    },
    { label: t.scoring, icon: Calculator, path: "/docs/poangsystem" },
    {
      label: t.communication,
      icon: MessageSquare,
      path: "/docs/kommunikation",
    },
  ];

  const adminNav: NavItem[] = [
    { label: t.configuration, icon: Sliders, path: "/docs/konfiguration" },
    { label: t.manageRules, icon: BookOpen, path: "/docs/regler" },
  ];

  const otherNav: NavItem[] = [
    { label: t.faq, icon: HelpCircle, path: "/docs/faq" },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex flex-col gap-1">
          <NjordaLogo collapsed={collapsed} />
          {!collapsed && (
            <span className="text-xs text-muted-foreground pl-[42px]">
              {t.docsLabel}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup
          label={t.groupGettingStarted}
          items={gettingStartedNav}
          pathname={location.pathname}
          navigate={navigate}
        />
        <NavGroup
          label={t.groupAdvisor}
          items={advisorNav}
          pathname={location.pathname}
          navigate={navigate}
        />
        <NavGroup
          label={t.groupAdmin}
          items={adminNav}
          pathname={location.pathname}
          navigate={navigate}
        />
        <NavGroup
          label={t.groupOther}
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
              tooltip={t.backToApp}
            >
              <ArrowLeft className="size-4" />
              <span>{t.backToApp}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

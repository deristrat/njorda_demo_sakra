import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { ToastDemo } from "@/components/dashboard/ToastDemo";
import { PieChart } from "@/components/charts/PieChart";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { BarChart } from "@/components/charts/BarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage, type Lang } from "@/lib/language";

const translations = {
  sv: {
    pageTitle: "Dashboard — Säkra",
    headerTitle: "Dashboard",
    portfolioAllocation: "Portföljfördelning",
    aumDevelopment: "AUM-utveckling (mkr)",
    meetingsPerWeek: "Möten per vecka",
    toastNotifications: "Toast-notifieringar",
  },
  en: {
    pageTitle: "Dashboard — Säkra",
    headerTitle: "Dashboard",
    portfolioAllocation: "Portfolio allocation",
    aumDevelopment: "AUM development (MSEK)",
    meetingsPerWeek: "Meetings per week",
    toastNotifications: "Toast notifications",
  },
} satisfies Record<Lang, Record<string, string>>;

export function DashboardPage() {
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  return (
    <>
      <AppHeader title={t.headerTitle} />
      <div className="space-y-6 p-6">
        <KPIGrid />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.portfolioAllocation}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.aumDevelopment}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiLineChart />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.meetingsPerWeek}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t.toastNotifications}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToastDemo />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

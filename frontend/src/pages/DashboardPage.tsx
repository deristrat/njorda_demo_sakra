import { useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { ToastDemo } from "@/components/dashboard/ToastDemo";
import { PieChart } from "@/components/charts/PieChart";
import { MultiLineChart } from "@/components/charts/MultiLineChart";
import { BarChart } from "@/components/charts/BarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard — Säkra";
  }, []);

  return (
    <>
      <AppHeader title="Dashboard" />
      <div className="space-y-6 p-6">
        <KPIGrid />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Portföljfördelning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AUM-utveckling (mkr)
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
              Möten per vecka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toast-notifieringar
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

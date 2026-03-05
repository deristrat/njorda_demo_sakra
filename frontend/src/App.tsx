import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ChatProvider } from "@/lib/chat-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { DocumentDetailPage } from "@/pages/DocumentDetailPage";
import { ComplianceStartPage } from "@/pages/ComplianceStartPage";
import { AdvisorStartPage } from "@/pages/AdvisorStartPage";
import { InboxPage } from "@/pages/InboxPage";
import { AuditPage } from "@/pages/AuditPage";
import { AuditEventDetailPage } from "@/pages/AuditEventDetailPage";
import { ComplianceReportPage } from "@/pages/ComplianceReportPage";
import { ComplianceReportDetailPage } from "@/pages/ComplianceReportDetailPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { ClientsListPage } from "@/pages/ClientsListPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { AdvisorsListPage } from "@/pages/AdvisorsListPage";
import { AdvisorDetailPage } from "@/pages/AdvisorDetailPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { FontSettingsPage } from "@/pages/FontSettingsPage";
import { ComplianceSettingsPage } from "@/pages/ComplianceSettingsPage";
import { ComplianceRuleDetailPage } from "@/pages/ComplianceRuleDetailPage";
import { CreateComplianceRulePage } from "@/pages/CreateComplianceRulePage";
import { DocsHomePage } from "@/pages/docs/DocsHomePage";
import { GettingStartedPage } from "@/pages/docs/GettingStartedPage";
import { DocsUploadPage } from "@/pages/docs/DocsUploadPage";
import { DocsDocumentsPage } from "@/pages/docs/DocsDocumentsPage";
import { DocsCompliancePage } from "@/pages/docs/DocsCompliancePage";
import { DocsScoringPage } from "@/pages/docs/DocsScoringPage";
import { DocsCommunicationPage } from "@/pages/docs/DocsCommunicationPage";
import { DocsConfigPage } from "@/pages/docs/DocsConfigPage";
import { DocsRulesPage } from "@/pages/docs/DocsRulesPage";
import { DocsFAQPage } from "@/pages/docs/DocsFAQPage";
import type { UserRole } from "@/types";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { isAuthenticated, effectiveRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!effectiveRole || !roles.includes(effectiveRole)) return <Navigate to="/start" replace />;
  return <Outlet />;
}

function StartPage() {
  const { effectiveRole } = useAuth();
  if (effectiveRole === "advisor") return <AdvisorStartPage />;
  return <ComplianceStartPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* All authenticated users */}
                <Route path="/" element={<Navigate to="/start" replace />} />
                <Route path="/start" element={<StartPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/archive" element={<DocumentsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/clients" element={<ClientsListPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/advisors" element={<AdvisorsListPage />} />
                <Route path="/advisors/:id" element={<AdvisorDetailPage />} />

                {/* compliance + njorda_admin only */}
                <Route element={<RoleRoute roles={["compliance", "njorda_admin"]} />}>
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/audit/:id" element={<AuditEventDetailPage />} />
                  <Route path="/reports/compliance" element={<ComplianceReportPage />} />
                  <Route path="/reports/compliance/:id" element={<ComplianceReportDetailPage />} />
                  <Route path="/settings" element={<FontSettingsPage />} />
                  <Route path="/settings/compliance" element={<ComplianceSettingsPage />} />
                  <Route path="/settings/compliance/new" element={<CreateComplianceRulePage />} />
                  <Route path="/settings/compliance/:ruleId" element={<ComplianceRuleDetailPage />} />
                </Route>

                {/* njorda_admin only */}
                <Route element={<RoleRoute roles={["njorda_admin"]} />}>
                  <Route path="/examples/dashboard" element={<DashboardPage />} />
                  <Route path="/examples/clients" element={<ClientsPage />} />
                  <Route path="/examples/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
            <Route element={<DocsLayout />}>
              <Route path="/docs" element={<DocsHomePage />} />
              <Route path="/docs/kom-igang" element={<GettingStartedPage />} />
              <Route path="/docs/ladda-upp" element={<DocsUploadPage />} />
              <Route path="/docs/dokument" element={<DocsDocumentsPage />} />
              <Route path="/docs/regelefterlevnad" element={<DocsCompliancePage />} />
              <Route path="/docs/poangsystem" element={<DocsScoringPage />} />
              <Route path="/docs/kommunikation" element={<DocsCommunicationPage />} />
              <Route path="/docs/konfiguration" element={<DocsConfigPage />} />
              <Route path="/docs/regler" element={<DocsRulesPage />} />
              <Route path="/docs/faq" element={<DocsFAQPage />} />
            </Route>
          </Routes>
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

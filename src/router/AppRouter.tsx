import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "../components/common/ProtectedRoute";
import { EnterpriseLayout } from "../components/layout/EnterpriseLayout";
import { LoginView } from "../views/LoginView";
import { UnauthorizedView } from "../views/UnauthorizedView";
import { EnterpriseDashboard } from "../views/EnterpriseDashboard";
import { KycOnboardingView } from "../views/KycOnboardingView";
import { AdminKycQueueView } from "../views/AdminKycQueueView";
import { AuctionListView } from "../views/AuctionListView";
import { CreateAuctionView } from "../views/CreateAuctionView";
import { EditAuctionView } from "../views/EditAuctionView";
import { AuctionDetailsView } from "../views/AuctionDetailsView";
import { AuctionSettingsView } from "../views/AuctionSettingsView";
import { LotListView } from "../views/LotListView";
import { CreateLotView } from "../views/CreateLotView";
import { EditLotView } from "../views/EditLotView";
import { LotDetailsView } from "../views/LotDetailsView";
import { BulkLotImportView } from "../views/BulkLotImportView";
import { LiveAuctionDashboard } from "../views/LiveAuctionDashboard";
import { LiveBidConsole } from "../views/LiveBidConsole";
import { USER_ROLE } from "../constants";

// LAZY LOADED SECURE FINANCE OPERATIONS PORTALS
const FinanceDashboardView = lazy(() => import("../views/FinanceDashboardView"));
const SettlementListView = lazy(() => import("../views/SettlementListView"));
const SettlementDetailsView = lazy(() => import("../views/SettlementDetailsView"));
const InvoiceListView = lazy(() => import("../views/InvoiceListView"));
const WalletView = lazy(() => import("../views/WalletView"));
const LedgerView = lazy(() => import("../views/LedgerView"));
const RefundManagementView = lazy(() => import("../views/RefundManagementView"));
const PaymentApprovalView = lazy(() => import("../views/PaymentApprovalView"));
const PaymentReconciliationView = lazy(() => import("../views/PaymentReconciliationView"));

const FinanceLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-12 font-mono text-xs text-slate-500 uppercase tracking-wider animate-pulse">
    Loading secure finance channel...
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC SECURITY PORTALS */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginView />
            </PublicRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedView />} />

        {/* SECURE SYSTEMS WRAPPED IN ENTERPRISE SHELLS */}
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <EnterpriseDashboard initialTab="monitoring" />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schema"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <EnterpriseDashboard initialTab="visual" />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <KycOnboardingView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <AdminKycQueueView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <AuctionListView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/create"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <CreateAuctionView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <AuctionDetailsView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/edit"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <EditAuctionView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/settings"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <AuctionSettingsView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/live"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <LiveAuctionDashboard />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/lots"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <LotListView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/lots/create"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <CreateLotView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/lots/import"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <BulkLotImportView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/lots/:lotId"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <LotDetailsView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/lots/:lotId/edit"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <EditLotView />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id/lots/:lotId/bid"
          element={
            <ProtectedRoute>
              <EnterpriseLayout>
                <LiveBidConsole />
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />

        {/* FINANCE OPERATIONS PORTALS */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <FinanceDashboardView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/settlements"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <SettlementListView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/settlements/:settlementId"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <SettlementDetailsView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/invoices"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <InvoiceListView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/wallet"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <WalletView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/ledger"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <LedgerView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/refunds"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <RefundManagementView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/payments"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <PaymentApprovalView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/reconciliation"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
              <EnterpriseLayout>
                <Suspense fallback={<FinanceLoadingFallback />}>
                  <PaymentReconciliationView />
                </Suspense>
              </EnterpriseLayout>
            </ProtectedRoute>
          }
        />

        {/* DEFAULT SYSTEMS REDIRECTION */}
        <Route path="/" element={<Navigate to="/monitoring" replace />} />
        <Route path="*" element={<Navigate to="/monitoring" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRouter;


import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "../components/common/ProtectedRoute";
import { EnterpriseLayout } from "../components/layout/EnterpriseLayout";
import { USER_ROLE } from "../constants";

// ROUTE-LEVEL LAZY LOADED VIEWS
const LoginView = lazy(() => import("../views/LoginView"));
const UnauthorizedView = lazy(() => import("../views/UnauthorizedView"));
const EnterpriseDashboard = lazy(() => import("../views/EnterpriseDashboard"));
const KycOnboardingView = lazy(() => import("../views/KycOnboardingView"));
const AdminKycQueueView = lazy(() => import("../views/AdminKycQueueView"));
const AuctionListView = lazy(() => import("../views/AuctionListView"));
const CreateAuctionView = lazy(() => import("../views/CreateAuctionView"));
const EditAuctionView = lazy(() => import("../views/EditAuctionView"));
const AuctionDetailsView = lazy(() => import("../views/AuctionDetailsView"));
const AuctionSettingsView = lazy(() => import("../views/AuctionSettingsView"));
const LotListView = lazy(() => import("../views/LotListView"));
const CreateLotView = lazy(() => import("../views/CreateLotView"));
const EditLotView = lazy(() => import("../views/EditLotView"));
const LotDetailsView = lazy(() => import("../views/LotDetailsView"));
const BulkLotImportView = lazy(() => import("../views/BulkLotImportView"));
const LiveAuctionDashboard = lazy(() => import("../views/LiveAuctionDashboard"));
const LiveBidConsole = lazy(() => import("../views/LiveBidConsole"));
const RoleManagementView = lazy(() => import("../views/admin/RoleManagementView").then(m => ({ default: m.RoleManagementView })));

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

import { SkeletonLoader } from "../components/common/SkeletonLoader";

const PageLoadingFallback: React.FC = () => (
  <div className="p-8 max-w-7xl mx-auto space-y-6">
    <SkeletonLoader variant="card" count={3} />
    <SkeletonLoader variant="table-row" count={4} />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingFallback />}>
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
              <ProtectedRoute requiredPermission={["kyc.review", "seller.review", USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATIONS]}>
                <EnterpriseLayout>
                  <AdminKycQueueView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute requiredPermission={["role.manage", USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]}>
                <EnterpriseLayout>
                  <RoleManagementView />
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
              <ProtectedRoute requiredPermission="auction.create">
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
              <ProtectedRoute requiredPermission="auction.edit">
                <EnterpriseLayout>
                  <EditAuctionView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/:id/settings"
            element={
              <ProtectedRoute requiredPermission="auction.edit">
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
              <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SELLER]}>
                <EnterpriseLayout>
                  <CreateLotView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/:id/lots/import"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SELLER]}>
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
              <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SELLER]}>
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
              <ProtectedRoute requiredPermission={["finance.wallet.view", "finance.ledger.view", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <FinanceDashboardView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/settlements"
            element={
              <ProtectedRoute requiredPermission={["settlement.view", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <SettlementListView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/settlements/:settlementId"
            element={
              <ProtectedRoute requiredPermission={["settlement.view", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <SettlementDetailsView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices"
            element={
              <ProtectedRoute requiredPermission={["invoice.view", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <InvoiceListView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/wallet"
            element={
              <ProtectedRoute requiredPermission={["finance.wallet.view", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <WalletView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/ledger"
            element={
              <ProtectedRoute requiredPermission={["finance.ledger.view", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <LedgerView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/refunds"
            element={
              <ProtectedRoute requiredPermission={["refund.approve", "refund.create", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <RefundManagementView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/payments"
            element={
              <ProtectedRoute requiredPermission={["payment.view", "payment.create", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <PaymentApprovalView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/reconciliation"
            element={
              <ProtectedRoute requiredPermission={["reconciliation.perform", USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN]}>
                <EnterpriseLayout>
                  <PaymentReconciliationView />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* DEFAULT SYSTEMS REDIRECTION */}
          <Route path="/" element={<Navigate to="/monitoring" replace />} />
          <Route path="*" element={<Navigate to="/monitoring" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
export default AppRouter;

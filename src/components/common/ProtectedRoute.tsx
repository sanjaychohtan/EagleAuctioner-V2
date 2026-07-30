import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, sanitizeRedirectUrl } from "../../context/AuthContext";
import { USER_ROLE } from "../../constants";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: (USER_ROLE | string)[];
  requiredPermission?: string | string[];
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <span className="h-8 w-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider animate-pulse">VERIFYING ENTERPRISE VAULT SESSION...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save current path for post-login return redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <span className="h-8 w-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider animate-pulse">VERIFYING SESSION STATE...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    // If authenticated, redirect back to home or referring page safely
    const rawFrom = (location.state as any)?.from?.pathname;
    const targetPath = sanitizeRedirectUrl(rawFrom);
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: (USER_ROLE | string)[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: string | string[];
  fallback?: ReactNode;
}

export function PermissionGuard({ children, requiredPermission, fallback }: PermissionGuardProps) {
  const { hasRole } = useAuth();
  
  // Maps a permission requirement to equivalent system roles or validates string matches
  const isAuthorized = Array.isArray(requiredPermission)
    ? requiredPermission.some((perm) => hasRole(perm))
    : hasRole(requiredPermission);

  if (!isAuthorized) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

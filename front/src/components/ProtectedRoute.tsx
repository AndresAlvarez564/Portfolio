// ProtectedRoute — guards routes based on authentication and Cognito group membership.
//
// Usage:
//   <ProtectedRoute>                          // requires any authenticated user
//   <ProtectedRoute requiredGroups={["admin"]}> // requires admin group
//
// Behavior:
//   - Loading    → spinner
//   - Not authenticated → redirect to /admin/login
//   - Authenticated, missing required group → Access Denied page
//   - Authenticated, group satisfied → render children

import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuthContext } from "../context/AuthContext";
import { ROUTES } from "../constants";
import AccessDeniedPage from "../pages/public/AccessDeniedPage";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Cognito groups required to access this route. Defaults to ["admin"]. */
  requiredGroups?: string[];
}

const ProtectedRoute = ({ children, requiredGroups = ["admin"] }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  // Check group membership — currently only "admin" group exists,
  // but the prop is generic for future extensibility.
  const hasRequiredGroup = requiredGroups.every(group =>
    group === "admin" ? isAdmin : false,
  );

  if (!hasRequiredGroup) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

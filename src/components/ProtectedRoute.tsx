import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSeller?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireSeller = false 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (authLoading || (requireAdmin && adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if authentication required but user not logged in
  if (requireAuth && !user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Redirect to home if admin access required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Redirect to home if seller access required but user is not a seller
  if (requireSeller && user) {
    // Check if user has seller profile (this would need to be added to useAuth hook)
    // For now, just check if user exists
    // TODO: Add seller check to useAuth hook
  }

  return <>{children}</>;
};

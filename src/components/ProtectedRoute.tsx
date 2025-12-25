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
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Show loading spinner while checking auth status
  // Include profileLoading for seller routes since seller status comes from profile
  const isLoading = authLoading ||
    (requireAdmin && adminLoading) ||
    (requireSeller && profileLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if authentication required but user not logged in
  if (requireAuth && !user) {
    // Preserve full URL including search params and hash
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }

  // Redirect to home if admin access required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Redirect to home if seller access required but user is not a seller
  if (requireSeller && user && !profile?.is_seller) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

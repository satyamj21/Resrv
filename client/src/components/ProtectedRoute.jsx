import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protects routes by role.
 *   <ProtectedRoute />                → any authenticated user
 *   <ProtectedRoute allowedRole="admin" />  → admin only
 *   <ProtectedRoute allowedRole="user" />   → normal user only
 */
export default function ProtectedRoute({ allowedRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="page-shell flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm font-medium text-muted">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sage border-t-transparent" />
          <span>Verifying account…</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Admins trying to hit user pages → send to admin dashboard
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    // Regular users trying to hit admin pages → send home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

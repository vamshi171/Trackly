import { Navigate } from "react-router-dom";
import { isAuthenticated, getCurrentRole } from "../utils/tokenUtils";

/**
 * 🔐 Protected Route Component
 * Checks authentication and role before allowing access
 * 
 * Usage:
 * <ProtectedRoute element={<Dashboard />} requiredRole="USER" />
 * <ProtectedRoute element={<AdminPanel />} requiredRole="ADMIN" />
 */
export default function ProtectedRoute({ element, requiredRole = "USER" }) {
    const isAuth = isAuthenticated();
    const userRole = getCurrentRole();

    // Not authenticated - redirect to login
    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    // Admin can access all routes
    if (userRole === "ADMIN") {
        return element;
    }

    // Check role access
    if (requiredRole === "ADMIN" && userRole !== "ADMIN") {
        // User trying to access admin route - redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === "USER" && !userRole) {
        // Invalid token - redirect to login
        return <Navigate to="/login" replace />;
    }

    // Access granted
    return element;
}
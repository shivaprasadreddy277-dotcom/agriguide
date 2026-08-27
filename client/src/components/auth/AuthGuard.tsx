import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.js";

/**
 * Higher-order component to guard private routes.
 */
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated Spinner with forest green accents */}
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-lg animate-pulse font-sans">Loading AgriGuide profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and preserve the location they attempted to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
export default AuthGuard;

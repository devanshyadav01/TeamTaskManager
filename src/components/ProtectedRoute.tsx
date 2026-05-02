import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode; requireRole?: AppRole }) => {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireRole && role !== requireRole) {
    return <Navigate to={role === "admin" ? "/admin" : "/member"} replace />;
  }
  return <>{children}</>;
};

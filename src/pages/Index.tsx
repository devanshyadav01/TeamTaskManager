import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate("/auth", { replace: true });
    else navigate(role === "admin" ? "/admin" : "/member", { replace: true });
  }, [session, role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
};

export default Index;

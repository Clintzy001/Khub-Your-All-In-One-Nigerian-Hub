import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    const run = async () => {
      try {
        // Detect password recovery flow (Supabase puts type=recovery in URL hash)
        const hash = window.location.hash;
        const isRecovery = hash.includes("type=recovery");

        // Supabase JS auto-handles the session from the URL
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isRecovery) {
          setMessage("Redirecting to password reset...");
          navigate("/reset-password", { replace: true });
          return;
        }

        if (data.session) {
          toast.success("Signed in successfully");
          navigate("/dashboard", { replace: true });
        } else {
          // Wait briefly for auth state listener, then re-check
          setTimeout(async () => {
            const { data: again } = await supabase.auth.getSession();
            if (again.session) {
              navigate("/dashboard", { replace: true });
            } else {
              toast.error("Could not complete sign-in");
              navigate("/login", { replace: true });
            }
          }, 1200);
        }
      } catch (err: any) {
        toast.error(err.message || "Authentication failed");
        navigate("/login", { replace: true });
      }
    };
    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default AuthCallbackPage;

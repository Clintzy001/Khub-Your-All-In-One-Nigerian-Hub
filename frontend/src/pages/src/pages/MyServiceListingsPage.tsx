import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, ShieldCheck, AlertTriangle, Plus, ArrowLeft } from "lucide-react";
import PostServiceDialog from "@/components/services/PostServiceDialog";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  price_basic: number;
}

interface RiskCheck {
  id: string;
  entity_id: string | null;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  decision: "allowed" | "warned" | "blocked";
  reasons: any;
  raw_input: any;
  created_at: string;
}

const decisionStyle = {
  blocked: "text-destructive bg-destructive/10 border-destructive/30",
  warned: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  allowed: "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400",
} as const;
const decisionIcon = { blocked: ShieldAlert, warned: AlertTriangle, allowed: ShieldCheck } as const;

const MyServiceListingsPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [risks, setRisks] = useState<RiskCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [svcRes, riskRes] = await Promise.all([
      supabase.from("services").select("*").eq("provider_id", user.id).order("created_at", { ascending: false }),
      supabase.from("post_risk_checks").select("*").eq("user_id", user.id).eq("entity_type", "service").order("created_at", { ascending: false }),
    ]);
    setServices((svcRes.data || []) as Service[]);
    setRisks((riskRes.data || []) as RiskCheck[]);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const riskFor = (s: Service) =>
    risks.find((r) => r.entity_id === s.id) ||
    risks.find((r) => (r.raw_input as any)?.title === s.title);

  if (authLoading) return <div className="container py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
  if (!isAuthenticated) return (
    <div className="container py-20 text-center">
      <p>Please log in to view your listings.</p>
      <Link to="/login"><Button className="mt-4 gradient-purple text-primary-foreground">Login</Button></Link>
    </div>
  );

  return (
    <div className="container py-6 px-4">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <Link to="/dashboard" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-1"><ArrowLeft className="w-3 h-3" /> Dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Service Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Review approval status and AI safety scans for each listing.</p>
        </div>
        <Button onClick={() => setOpenPost(true)} className="gradient-purple text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Post a Service
        </Button>
      </div>

      {/* Past scan results — recent attempts not yet linked to a service */}
      {risks.filter((r) => !services.some((s) => s.id === r.entity_id || (r.raw_input as any)?.title === s.title)).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">Recent AI safety scans (not published)</h2>
          <div className="space-y-2">
            {risks
              .filter((r) => !services.some((s) => s.id === r.entity_id || (r.raw_input as any)?.title === s.title))
              .slice(0, 5)
              .map((r) => {
                const Icon = decisionIcon[r.decision];
                return (
                  <div key={r.id} className={`border rounded-lg p-3 text-xs flex gap-2 ${decisionStyle[r.decision]}`}>
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {(r.raw_input as any)?.title || "Untitled"} · {r.decision} · {r.risk_score}/100
                      </p>
                      <p className="opacity-80 mt-0.5">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <p>You haven't posted any services yet.</p>
          <Button onClick={() => setOpenPost(true)} className="mt-4 gradient-purple text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Post your first service
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => {
            const r = riskFor(s);
            const Icon = r ? decisionIcon[r.decision] : ShieldCheck;
            return (
              <div key={s.id} className="border border-border rounded-xl p-4 bg-card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{s.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s.category}</span>
                      {s.is_approved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Approved</span>
                      ) : s.is_active ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending review</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {s.location || "Nigeria"} · ₦{Number(s.price_basic || 0).toLocaleString()} · posted {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className={`mt-3 p-2.5 rounded-lg border text-xs flex gap-2 ${r ? decisionStyle[r.decision] : decisionStyle.allowed}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {r ? (
                      <>
                        <p className="font-semibold capitalize">
                          AI safety: {r.decision} · score {r.risk_score}/100 · {r.risk_level}
                        </p>
                        {Array.isArray(r.reasons) && r.reasons.length > 0 && (
                          <ul className="mt-1 list-disc pl-4 space-y-0.5 opacity-90">
                            {r.reasons.slice(0, 4).map((x: string, i: number) => <li key={i}>{x}</li>)}
                          </ul>
                        )}
                      </>
                    ) : (
                      <p>No AI scan recorded for this listing.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PostServiceDialog open={openPost} onOpenChange={setOpenPost} onPosted={load} />
    </div>
  );
};

export default MyServiceListingsPage;

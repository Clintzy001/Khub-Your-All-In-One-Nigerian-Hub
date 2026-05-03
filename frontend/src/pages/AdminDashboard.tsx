import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Users, Package, Wallet, Briefcase, Home, TrendingUp, Loader2, ShieldAlert } from "lucide-react";
import AdminServicesTab from "@/components/admin/AdminServicesTab";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStats from "@/components/admin/AdminStats";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminProductsTab from "@/components/admin/AdminProductsTab";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import AdminEscrowTab from "@/components/admin/AdminEscrowTab";
import AdminJobsTab from "@/components/admin/AdminJobsTab";
import AdminRentalsTab from "@/components/admin/AdminRentalsTab";
import AdminRevenueTab from "@/components/admin/AdminRevenueTab";

type Tab = "users" | "products" | "orders" | "escrow" | "jobs" | "rentals" | "services" | "revenue";

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  kyc_verified: boolean;
  subscription_active: boolean;
  roles: string[];
}

const AdminDashboard = () => {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) navigate("/login");
  }, [authLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [tab, isAdmin]);

  // Realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { if (tab === "orders" || tab === "revenue") loadData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "escrow_wallets" }, () => { if (tab === "escrow" || tab === "revenue") loadData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => { if (tab === "products") loadData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {})
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, tab]);

  const loadData = async () => {
    setLoading(true);
    // Always load all for stats
    const [profilesRes, rolesRes, productsRes, ordersRes, walletsRes, jobsRes, rentalsRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("escrow_wallets").select("*"),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("rentals").select("*").order("created_at", { ascending: false }),
    ]);

    const merged = (profilesRes.data || []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      kyc_verified: p.kyc_verified,
      subscription_active: p.subscription_active,
      roles: (rolesRes.data || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
    }));

    setUsers(merged);
    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setWallets(walletsRes.data || []);
    setJobs(jobsRes.data || []);
    setRentals(rentalsRes.data || []);
    setLoading(false);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: Package },
    { id: "escrow", label: "Escrow", icon: Wallet },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "rentals", label: "Rentals", icon: Home },
    { id: "services", label: "Services (AI)", icon: ShieldAlert },
    { id: "revenue", label: "Revenue", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="container px-4 py-6">
        <AdminStats users={users.length} products={products.length} orders={orders.length} wallets={wallets.length} jobs={jobs.length} rentals={rentals.length} totalRevenue={totalRevenue} />

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "gradient-purple text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
        ) : (
          <>
            {tab === "users" && <AdminUsersTab users={users} reload={loadData} />}
            {tab === "products" && <AdminProductsTab products={products} reload={loadData} />}
            {tab === "orders" && <AdminOrdersTab orders={orders} reload={loadData} />}
            {tab === "escrow" && <AdminEscrowTab wallets={wallets} reload={loadData} />}
            {tab === "jobs" && <AdminJobsTab jobs={jobs} reload={loadData} />}
            {tab === "rentals" && <AdminRentalsTab rentals={rentals} reload={loadData} />}
            {tab === "services" && <AdminServicesTab />}
            {tab === "revenue" && <AdminRevenueTab orders={orders} wallets={wallets} />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

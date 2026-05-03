import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, Truck, Briefcase, Home, BadgeCheck, Wallet, BarChart3, Shield, Loader2, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutDialog from "@/components/LogoutDialog";
import SellerDashboard from "@/components/seller/SellerDashboard";
import ReferralCard from "@/components/ReferralCard";

const roleDashboards: Record<string, { title: string; items: { icon: any; label: string; desc: string; to: string }[] }> = {
  buyer: {
    title: "Buyer Dashboard",
    items: [
      { icon: ShoppingBag, label: "My Orders", desc: "Track your purchases", to: "/dashboard" },
      { icon: Wallet, label: "Wallet", desc: "Balance & escrow funds", to: "/wallet" },
      { icon: User, label: "My Profile", desc: "View & edit profile", to: "/profile" },
      { icon: CreditCard, label: "Subscription", desc: "Manage your plan", to: "/subscription" },
    ],
  },
  driver: {
    title: "Driver Dashboard",
    items: [
      { icon: Truck, label: "Active Rides", desc: "Current bookings", to: "/dashboard" },
      { icon: Wallet, label: "Wallet", desc: "Earnings & withdraw", to: "/wallet" },
      { icon: User, label: "My Profile", desc: "Public driver profile", to: "/profile" },
      { icon: BadgeCheck, label: "Vehicle & KYC", desc: "Verification status", to: "/subscription" },
    ],
  },
  agent: {
    title: "Agent Dashboard",
    items: [
      { icon: Home, label: "My Listings", desc: "Manage properties", to: "/dashboard" },
      { icon: Wallet, label: "Wallet", desc: "Commission & payouts", to: "/wallet" },
      { icon: User, label: "My Profile", desc: "Agent profile", to: "/profile" },
      { icon: BadgeCheck, label: "Verification", desc: "Agent KYC status", to: "/subscription" },
    ],
  },
  jobposter: {
    title: "Job Poster Dashboard",
    items: [
      { icon: Briefcase, label: "My Job Posts", desc: "Manage openings", to: "/dashboard" },
      { icon: BarChart3, label: "Applications", desc: "Review candidates", to: "/dashboard" },
      { icon: Wallet, label: "Wallet", desc: "Posting credits", to: "/wallet" },
      { icon: BadgeCheck, label: "Verification", desc: "Company verification", to: "/subscription" },
    ],
  },
  service_provider: {
    title: "Service Provider Dashboard",
    items: [
      { icon: Briefcase, label: "My Services", desc: "Listings, AI scans & status", to: "/my-services" },
      { icon: BarChart3, label: "Bookings", desc: "Client requests", to: "/dashboard" },
      { icon: Wallet, label: "Wallet", desc: "Earnings & payouts", to: "/wallet" },
      { icon: BadgeCheck, label: "Verification", desc: "Provider KYC", to: "/kyc" },
    ],
  },
};

const DashboardPage = () => {
  const { user, profile, roles, isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">Please log in</h1>
        <Link to="/login"><Button className="mt-4 gradient-purple text-primary-foreground">Login</Button></Link>
      </div>
    );
  }

  const primaryRole = roles[0] || "buyer";
  const isSeller = primaryRole === "seller";

  return (
    <div className="container py-8 px-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {isSeller ? "Seller Dashboard" : (roleDashboards[primaryRole]?.title || "Dashboard")}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground">{profile?.full_name || user.email}</span>
            {profile?.kyc_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
            {profile?.subscription_active && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">VERIFIED</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="text-primary border-primary/30">
                <Shield className="w-4 h-4 mr-1" /> Admin Panel
              </Button>
            </Link>
          )}
          <LogoutDialog />
        </div>
      </div>

      {isSeller ? (
        <div className="space-y-6">
          <SellerDashboard />
          <ReferralCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(roleDashboards[primaryRole]?.items || roleDashboards.buyer.items).map((item) => (
              <Link key={item.label} to={item.to} className="p-5 border border-border rounded-xl bg-card hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
          <div className="lg:col-span-1">
            <ReferralCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

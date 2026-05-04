import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import KhubLogo from "@/components/KhubLogo";
import { toast } from "sonner";

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "buyer", label: "Buyer", desc: "Shop, hire, and book services" },
  { value: "seller", label: "Seller", desc: "Sell products on the marketplace" },
  { value: "driver", label: "Driver / Dispatch Rider", desc: "Provide delivery and transport services" },
  { value: "agent", label: "Rental Agent", desc: "List properties and rentals" },
  { value: "jobposter", label: "Job Poster", desc: "Post job opportunities" },
  { value: "service_provider", label: "Service Provider", desc: "Offer professional services" },
];

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referral: "",
    profession: "",
    experience: "",
    location: ""
  });

  const [role, setRole] = useState<UserRole>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setForm((f) => ({ ...f, referral: ref.trim().toUpperCase() }));
  }, [searchParams]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Extra validation for service providers
    if (role === "service_provider") {
      if (!form.profession || !form.location) {
        toast.error("Please complete your service details");
        return;
      }
    }

    setSubmitting(true);

    const { error } = await register(
      form.email,
      form.password,
      form.name,
      form.phone,
      role,
      form.referral || undefined,
      role === "service_provider"
        ? {
            profession: form.profession,
            experience: form.experience,
            location: form.location,
          }
        : undefined
    );

    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Account created! Please check your email to verify.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <KhubLogo size={48} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join Khub and start your journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-border rounded-xl bg-card">
          
          {/* ROLE SELECTION */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              I want to register as
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-lg border text-left transition-all text-xs ${
                    role === r.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="font-medium text-foreground block">
                    {r.label}
                  </span>
                  <span className="text-muted-foreground">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* NAME & PHONE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+234..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-sm"
                />
              </div>
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-sm"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border bg-background text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirm</label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-sm"
                />
              </div>
            </div>
          </div>

          {/* REFERRAL */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Referral Code <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={form.referral}
                onChange={(e) =>
                  setForm({ ...form, referral: e.target.value.toUpperCase() })
                }
                placeholder="KHXXXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-sm uppercase"
              />
            </div>
          </div>

          {/* SERVICE PROVIDER EXTRA */}
          {role === "service_provider" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <h3 className="text-sm font-semibold">Service Details</h3>
              <input
                type="text"
                placeholder="Profession (e.g. Plumber)"
                value={form.profession}
                onChange={update("profession")}
                className="w-full py-3 px-4 rounded-lg border bg-background text-sm"
              />
              <input
                type="text"
                placeholder="Years of Experience"
                value={form.experience}
                onChange={update("experience")}
                className="w-full py-3 px-4 rounded-lg border bg-background text-sm"
              />
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={update("location")}
                className="w-full py-3 px-4 rounded-lg border bg-background text-sm"
              />
            </div>
          )}

          {/* TERMS */}
          <div className="flex items-start gap-2">
            <input type="checkbox" required className="mt-1 accent-primary" />
            <span className="text-xs text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link to="/refund-policy" className="text-primary hover:underline">
                Refund Policy
              </Link>
            </span>
          </div>

          {/* SUBMIT */}
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

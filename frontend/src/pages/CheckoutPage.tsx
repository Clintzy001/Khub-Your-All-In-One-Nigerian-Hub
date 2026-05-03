import { useState } from "react";
import { MapPin, CreditCard, Shield, ArrowRight, Tag, Wallet, Building2, Smartphone, ChevronDown, ChevronUp, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const nigerianStates = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

const paymentMethods = [
  { id: "paystack", label: "Paystack", desc: "Cards, Bank, USSD", icon: CreditCard, color: "text-blue-500" },
  { id: "flutterwave", label: "Flutterwave", desc: "Cards, Mobile Money", icon: Wallet, color: "text-orange-500" },
  { id: "opay", label: "OPay", desc: "OPay Wallet", icon: Smartphone, color: "text-green-500" },
  { id: "bank", label: "Bank Transfer", desc: "Direct transfer", icon: Building2, color: "text-muted-foreground" },
] as const;

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", email: user?.email || "", address: "", city: "", state: "Kano" });
  const [paymentMethod, setPaymentMethod] = useState<string>("paystack");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [processing, setProcessing] = useState(false);

  const deliveryFee = 2500;
  const serviceFee = Math.round(total * 0.02);
  const discount = couponApplied ? Math.round(total * 0.05) : 0;
  const grandTotal = total + deliveryFee + serviceFee - discount;

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const applyCoupon = () => {
    if (coupon.toLowerCase() === "khub5") {
      setCouponApplied(true);
      toast.success("Coupon applied! 5% discount");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) { toast.error("Please fill all delivery details"); return; }
    if (!isAuthenticated) { toast.error("Please login to complete checkout"); navigate("/login"); return; }

    setProcessing(true);
    // Simulate payment initialization (real Paystack integration when API key is added)
    await new Promise(r => setTimeout(r, 2000));
    toast.success("Order placed! Payment will be processed via " + paymentMethods.find(m => m.id === paymentMethod)?.label);
    toast.info("Funds are held in escrow until delivery is confirmed");
    clearCart();
    setProcessing(false);
    navigate("/dashboard");
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Secure Checkout</h1>
          <p className="text-xs text-muted-foreground">Powered by Escrow Protection</p>
        </div>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Delivery */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 border border-border rounded-2xl bg-card space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" /> Delivery Details
          </h2>
          <input type="text" value={form.name} onChange={update("name")} placeholder="Full Name" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
          <div className="grid grid-cols-2 gap-3">
            <input type="tel" value={form.phone} onChange={update("phone")} placeholder="Phone (+234...)" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
            <input type="email" value={form.email} onChange={update("email")} placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
          </div>
          <input type="text" value={form.address} onChange={update("address")} placeholder="Delivery Address" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.city} onChange={update("city")} placeholder="City" className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
            <select value={form.state} onChange={update("state")} className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
              {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 border border-border rounded-2xl bg-card space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-primary" /> Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === method.id
                    ? "border-primary bg-accent ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <method.icon className={`w-5 h-5 mb-1 ${method.color}`} />
                <p className="text-sm font-medium text-foreground">{method.label}</p>
                <p className="text-[10px] text-muted-foreground">{method.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Escrow Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Escrow Protection</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your payment is held securely until delivery is confirmed. 15% platform fee applies. Funds are only released to the seller after both parties confirm the transaction.</p>
            </div>
          </div>
        </motion.div>

        {/* Coupon */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button type="button" onClick={() => setShowCoupon(!showCoupon)} className="flex items-center gap-2 text-sm text-primary font-medium">
            <Tag className="w-4 h-4" /> Have a coupon code?
            {showCoupon ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showCoupon && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex gap-2 mt-2">
                  <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Enter code (try KHUB5)" className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground" disabled={couponApplied} />
                  <Button type="button" onClick={applyCoupon} variant="outline" disabled={couponApplied} className="border-primary text-primary">
                    {couponApplied ? <CheckCircle className="w-4 h-4" /> : "Apply"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="p-5 border border-border rounded-2xl bg-card">
          <h2 className="font-semibold text-foreground mb-3 text-sm">Order Summary</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1.5">
              <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
              <span className="text-foreground font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-border mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-foreground">₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Fee (2%)</span>
              <span className="text-foreground">₦{serviceFee.toLocaleString()}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-sm">
                <span className="text-primary">Coupon Discount</span>
                <span className="text-primary">-₦{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-base">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <Button type="submit" className="w-full gradient-purple text-primary-foreground h-14 text-base font-semibold rounded-2xl" disabled={processing}>
          {processing ? (
            <span className="flex items-center gap-2">Processing... <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /></span>
          ) : (
            <>Pay ₦{grandTotal.toLocaleString()} <ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Secured with 256-bit SSL encryption
        </p>
      </form>
    </div>
  );
};

export default CheckoutPage;

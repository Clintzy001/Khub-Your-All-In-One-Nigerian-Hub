import { Link } from "react-router-dom";
import KhubLogo from "./KhubLogo";
import { Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <KhubLogo size={32} />
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Nigeria's all-in-one platform for shopping, jobs, rentals, and logistics.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> Kano State, Nigeria</div>
              <a href="https://wa.me/2347065036761?text=Hello%20KHUB%2C%20I%20need%20assistance" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="w-4 h-4 shrink-0" /> +234 706 503 6761 (WhatsApp)</a>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> +23470 180 038 63</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-primary transition-colors">{t("shop")}</Link></li>
              <li><Link to="/jobs" className="hover:text-primary transition-colors">{t("jobs")}</Link></li>
              <li><Link to="/rentals" className="hover:text-primary transition-colors">{t("rentals")}</Link></li>
              <li><Link to="/logistics" className="hover:text-primary transition-colors">{t("logistics")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-primary transition-colors">{t("login")}</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">{t("register")}</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Khub. {t("allRightsReserved")}.</p>
          <p className="text-xs text-muted-foreground">🇳🇬 Made in Nigeria. Currency: ₦ (Naira)</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

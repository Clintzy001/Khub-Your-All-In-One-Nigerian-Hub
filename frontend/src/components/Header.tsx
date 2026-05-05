import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Sun, Moon, Globe, Search, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import KhubLogo from "./KhubLogo";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import LogoutDialog from "./LogoutDialog";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();
  const { itemCount } = useCart();
  const { user, profile, isAuthenticated } = useAuth();

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/shop", label: t("shop") },
    { to: "/services", label: "Services" },
    { to: "/jobs", label: t("jobs") },
    { to: "/rentals", label: t("rentals") },
    { to: "/logistics", label: t("logistics") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16 gap-4">
        <Link to="/" className="shrink-0">
          <KhubLogo size={36} />
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language */}
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                {languages.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setLanguage(l.value); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${language === l.value ? "text-primary font-medium" : "text-foreground"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-purple text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium hidden sm:inline text-foreground">{profile?.full_name || user?.email}</span>
              </Link>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gradient-purple text-primary-foreground border-0">
                {t("login")}
              </Button>
            </Link>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card p-4 space-y-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={t("search")} className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors">
              {t("login")}
            </Link>
          )}
          {isAuthenticated && (
            <div className="pt-2 border-t border-border mt-2 space-y-1">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-md">Dashboard</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-md">Profile</Link>
              <Link to="/wallet" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-md">Wallet</Link>
              <div className="px-3 py-2">
                <LogoutDialog variant="ghost" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10 border-0 px-0" />
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

import { useState, useEffect, ReactNode } from "react";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";

// Contexts - Ensuring paths match your GitHub structure
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// UI Components
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Layout Components
import LoadingScreen from "@/components/LoadingScreen";
import Layout from "@/components/Layout";
import ChatBot from "@/components/ChatBot";
import BottomNav from "@/components/Layout/BottomNav";

// Pages
import Index from "./pages/Index";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import JobsPage from "./pages/JobsPage";
import RentalsPage from "./pages/RentalsPage";
import LogisticsPage from "./pages/LogisticsPage";
import ServicesPage from "./pages/ServicesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import KYCPage from "./pages/KYCPage";
import MyServiceListingsPage from "./pages/MyServiceListingsPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

// 1. Stable QueryClient instance (Outside component to prevent recreation on re-render)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// 🔐 PRIVATE ROUTE COMPONENT
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// 🌐 ROUTES COMPONENT
const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Index />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:productId" element={<ProductDetailPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/rentals" element={<RentalsPage />} />
        <Route path="/logistics" element={<LogisticsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* PROTECTED ROUTES */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
        <Route path="/kyc" element={<PrivateRoute><KYCPage /></PrivateRoute>} />
        <Route path="/my-services" element={<PrivateRoute><MyServiceListingsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />

        {/* 404 CATCH-ALL */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

// 🚀 MAIN APP COMPONENT
const App = () => {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // Artificial delay to show the beautiful LoadingScreen
    const timer = setTimeout(() => setAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                
                {/* Global UI Feedback */}
                <Toaster position="top-right" richColors closeButton />

                <AnimatePresence mode="wait">
                  {appLoading && <LoadingScreen key="loader" />}
                </AnimatePresence>

                <BrowserRouter>
                  <Layout>
                    <AppRoutes />
                  </Layout>
                  <ChatBot />
                </BrowserRouter>

              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

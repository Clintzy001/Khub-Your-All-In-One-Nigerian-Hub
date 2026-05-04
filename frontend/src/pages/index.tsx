import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Briefcase,
  Home,
  Truck,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Quote,
  Users
} from "lucide-react";

import HotDeals from "@/components/home/HotDeals";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const bannerSlides = [
  {
    title: "Shop Smarter with Khub",
    subtitle: "Buy safely from verified sellers with escrow protection.",
    cta: "Start Shopping",
    ctaLink: "/shop",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    gradient: "from-purple-900/90 to-indigo-900/90",
  },
  {
    title: "Find Real Jobs",
    subtitle: "Connect with employers across Nigeria.",
    cta: "Browse Jobs",
    ctaLink: "/jobs",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop",
    gradient: "from-blue-900/90 to-purple-900/90",
  },
  {
    title: "Rent Properties Easily",
    subtitle: "Find houses, shops, and offices with ease.",
    cta: "Explore Rentals",
    ctaLink: "/rentals",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    gradient: "from-emerald-900/90 to-purple-900/90",
  },
  {
    title: "Reliable Logistics",
    subtitle: "Fast delivery and transport services.",
    cta: "Book Now",
    ctaLink: "/logistics",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=600&fit=crop",
    gradient: "from-orange-900/90 to-purple-900/90",
  },
];

const services = [
  {
    icon: ShoppingBag,
    title: "Shop",
    desc: "Buy from verified sellers across Nigeria",
    to: "/shop",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: Briefcase,
    title: "Jobs",
    desc: "Find or post jobs easily",
    to: "/jobs",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Home,
    title: "Rentals",
    desc: "Find houses, shops and land",
    to: "/rentals",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Truck,
    title: "Logistics",
    desc: "Delivery and transport services",
    to: "/logistics",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Users,
    title: "Service Providers",
    desc: "Hire professionals like plumbers, designers and more",
    to: "/services",
    color: "from-pink-500 to-rose-500",
  },
];

const stats = [
  { value: "10K+", label: "Users" },
  { value: "5K+", label: "Sellers" },
  { value: "50K+", label: "Products" },
  { value: "36", label: "States" },
];

const categories = [
  "Electronics", "Fashion", "Phones & Tablets", "Health & Beauty",
  "Home & Office", "Computing", "Groceries", "Automobile",
  "Sports", "Gaming", "Baby Products", "Books",
];

const testimonials = [
  {
    name: "Amina Ibrahim",
    role: "Buyer",
    location: "Kano",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80",
    text: "I finally feel safe buying online.",
  },
  {
    name: "Chukwu Emeka",
    role: "Seller",
    location: "Lagos",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
    text: "Selling here is easy and reliable.",
  },
  {
    name: "Fatima Abubakar",
    role: "Agent",
    location: "Abuja",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
    text: "Great platform for property listings.",
  },
  {
    name: "Musa Danladi",
    role: "Rider",
    location: "Kano",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80",
    text: "Consistent delivery jobs.",
  },
];

const IndexPage = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>

      {/* BANNER */}
      <section className="relative overflow-hidden h-[420px] md:h-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <img
              src={bannerSlides[currentSlide].image}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${bannerSlides[currentSlide].gradient}`} />
          </motion.div>
        </AnimatePresence>

        <div className="container relative h-full flex items-center">
          <div className="max-w-xl text-white">
            <h1 className="text-4xl font-bold">
              {bannerSlides[currentSlide].title}
            </h1>
            <p className="mt-3 opacity-80">
              {bannerSlides[currentSlide].subtitle}
            </p>
            <Link to={bannerSlides[currentSlide].ctaLink}>
              <Button className="mt-5">
                {bannerSlides[currentSlide].cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-10">
            All Services
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {services.map((service) => (
              <Link
                key={service.title}
                to={service.to}
                className="p-6 border rounded-xl hover:shadow-md transition"
              >
                <service.icon className="w-6 h-6 mb-3" />
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {service.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HotDeals />

      {/* TESTIMONIALS */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">
            User Feedback
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((item) => (
              <div key={item.name} className="p-4 border rounded-xl">
                <Quote className="w-5 h-5 mb-2" />
                <p className="text-sm mb-3">{item.text}</p>
                <div className="flex items-center gap-2">
                  <img src={item.avatar} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.role} • {item.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default IndexPage;

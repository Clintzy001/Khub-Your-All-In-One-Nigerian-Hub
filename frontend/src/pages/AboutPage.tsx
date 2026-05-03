import KhubLogo from "@/components/KhubLogo";
import { MapPin, Phone, Shield, Users, Globe } from "lucide-react";

const AboutPage = () => (
  <div className="container py-12 max-w-3xl">
    <div className="flex justify-center mb-6"><KhubLogo size={56} /></div>
    <h1 className="text-3xl font-bold text-foreground text-center">About Khub</h1>
    <p className="text-muted-foreground text-center mt-2 mb-8">Your No. 1 Business Hub in Nigeria</p>

    <div className="prose prose-sm max-w-none space-y-6 text-foreground">
      <p className="text-muted-foreground leading-relaxed">
        Khub is Nigeria's all-in-one platform that brings together e-commerce, job postings, property rentals, and logistics services. 
        Founded in Kano State, Nigeria, we aim to simplify how Nigerians buy, sell, hire, rent, and deliver across all 36 states.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 my-8">
        {[
          { icon: Shield, title: "Secure Transactions", desc: "Escrow-protected payments for all purchases" },
          { icon: Users, title: "Verified Community", desc: "KYC-verified sellers, agents, and drivers" },
          { icon: Globe, title: "Pan-Nigeria Coverage", desc: "Services across all 36 states" },
          { icon: MapPin, title: "Based in Kano", desc: "Proudly Nigerian, serving Nigerians" },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-lg border border-border bg-card">
            <item.icon className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold text-foreground mb-2">Contact Us</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Kano State, Nigeria</p>
          <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +234 706 503 6761</p>
          <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +234 180 038 63</p>
        </div>
      </div>
    </div>
  </div>
);

export default AboutPage;

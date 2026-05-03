import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill all required fields"); return; }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 1000);
  };

  const whatsappUrl = `https://wa.me/2347065036761?text=${encodeURIComponent("Hello KHUB, I need assistance")}`;

  return (
    <div className="container py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
        <p className="text-muted-foreground mt-2">We're here to help. Reach out anytime.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="p-6 border border-border rounded-xl bg-card space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Address</h3>
                <p className="text-sm text-muted-foreground">Kano State, Nigeria</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Phone</h3>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1">
                  <MessageCircle className="w-4 h-4" /> +234 706 503 6761 (WhatsApp)
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="text-sm text-muted-foreground">support@khub.com.ng</p>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
            <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
          </a>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="p-6 border border-border rounded-xl bg-card space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Name *</label>
            <input type="text" value={form.name} onChange={update("name")} placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
            <input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
            <input type="text" value={form.subject} onChange={update("subject")} placeholder="How can we help?"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Message *</label>
            <textarea value={form.message} onChange={update("message")} placeholder="Tell us more..." rows={4}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <Button type="submit" className="w-full gradient-purple text-primary-foreground" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send Message
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;

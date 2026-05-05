import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const FAQ: Record<string, string> = {
  "how do i sell": "To sell on Khub, register as a Seller, complete KYC verification, and subscribe to a Verified or Premium plan. Then go to Dashboard → My Products to list items.",
  "how to pay": "Khub supports Debit Card, Bank Transfer, and OPay via Paystack. All payments are secured with escrow protection.",
  "what is escrow": "Escrow holds buyer funds securely until delivery is confirmed. This protects both buyers and sellers from fraud.",
  "how to withdraw": "Go to Wallet → Withdraw. You must be a Verified or Premium user. Funds are sent to your linked bank account within 24 hours.",
  "how to verify": "Go to Subscription → Get Verified. You'll need to upload a valid government ID and complete facial verification.",
  "refund policy": "Refunds are processed within 7 business days if the item doesn't match the description or isn't delivered. Visit our Refund Policy page for details.",
  "delivery time": "Delivery within Kano State takes 1-3 days. Inter-state delivery takes 3-7 business days depending on location.",
  "contact support": "You can reach us at +234 706 503 6761 (WhatsApp) or +234 701 800 3863. Our support hours are 8AM - 8PM WAT.",
  "subscription plans": "Free: 5 listings (3-day expiry). Verified (₦5,000/mo): 10 listings, full selling. Premium (₦15,000/mo): 30 listings, priority boost.",
};

function findFAQAnswer(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key) || key.split(" ").every(w => lower.includes(w))) return answer;
  }
  return null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! 👋 I'm Khub Assistant. How can I help you today? Ask about selling, payments, escrow, or anything else!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Check FAQ first
    const faqAnswer = findFAQAnswer(userMsg.content);
    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: faqAnswer }]);
      }, 500);
      return;
    }

    // Call AI edge function
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-10) }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m));
            }
          } catch { /* partial */ }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting right now. You can reach our support team directly:\n\n📱 WhatsApp: +234 706 503 6761\n📞 Call: +234 701 800 3863",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/2347065036761?text=Hello%20KHUB%2C%20I%20need%20assistance", "_blank");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[340px] sm:w-[380px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-purple p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-primary-foreground text-sm">Khub Assistant</h3>
                <p className="text-[10px] text-primary-foreground/70">Online • Typically replies instantly</p>
              </div>
              <div className="flex gap-1">
                <button onClick={openWhatsApp} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary-foreground" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "gradient-purple text-primary-foreground rounded-br-sm"
                      : "bg-accent text-foreground rounded-bl-sm"
                  }`}>
                    {msg.content || (loading && <Loader2 className="w-4 h-4 animate-spin" />)}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
              {["How to sell", "Payment methods", "Escrow info", "Contact support"].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="px-2.5 py-1 text-[10px] rounded-full border border-border bg-background text-muted-foreground hover:border-primary/50 whitespace-nowrap transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()} className="gradient-purple text-primary-foreground shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full gradient-purple shadow-lg flex items-center justify-center text-primary-foreground"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

export default ChatBot;

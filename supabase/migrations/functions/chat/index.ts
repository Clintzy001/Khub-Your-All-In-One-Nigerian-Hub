import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // fast + cheap + powerful
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are KHUB Assistant, the AI support system for KHUB (Nigeria's All-in-One Marketplace).

You help users with:
- Buying & selling products
- Wallet, escrow & payments (Paystack, bank transfer)
- KYC verification
- Logistics, rentals & jobs
- Subscription plans:
  Free → limited access
  Verified → ₦5,000/month
  Premium → ₦15,000/month

Style:
- Use simple Nigerian English
- Be friendly and direct
- Avoid long explanations
- Focus on solving user problems fast

If issue is unresolved:
👉 Tell user to contact:
WhatsApp: +2347065036761

Currency: Nigerian Naira (₦)
`,
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", response.status, text);

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (err) {
    console.error("chat error:", err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

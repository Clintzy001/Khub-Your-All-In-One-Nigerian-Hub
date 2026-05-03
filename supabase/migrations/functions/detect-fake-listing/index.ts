import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DetectionInput {
  entity_type: "product" | "service" | "rental" | "job" | "logistics";
  title: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔐 ENV CONFIG
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🔐 AUTH CHECK
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 📥 INPUT VALIDATION
    const body: DetectionInput = await req.json();

    if (!body?.title || !body?.entity_type) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🧠 AI PROMPT
    const prompt = `
You are a fraud detection AI for KHUB, a Nigerian marketplace.

Analyze this listing and return JSON ONLY:

{
  "risk_score": number (0-100),
  "risk_level": "low" | "medium" | "high",
  "reasons": [string],
  "summary": string
}

Check for:
- Unrealistic price
- Scam keywords
- Fake products
- Missing details
- Suspicious wording

Listing:
Type: ${body.entity_type}
Title: ${body.title}
Category: ${body.category || "n/a"}
Price: ${body.price ?? "n/a"}
Images: ${body.images?.length ?? 0}
Description: ${body.description || "none"}
`;

    // 🚀 AI CALL (OPENAI / DEEPSEEK COMPATIBLE)
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 🔥 fast & cheap (or swap to deepseek if needed)
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      console.error("AI error:", err);

      return new Response(JSON.stringify({ error: "AI failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    let result;

    try {
      result = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      console.error("JSON parse error:", e);

      result = {
        risk_score: 50,
        risk_level: "medium",
        reasons: ["AI response parsing failed"],
        summary: "Unable to fully analyze listing",
      };
    }

    // 🎯 DECISION ENGINE
    const decision =
      result.risk_score >= 80
        ? "blocked"
        : result.risk_score >= 50
        ? "warned"
        : "allowed";

    // 🗄 LOG TO SUPABASE
    await supabase.from("post_risk_checks").insert({
      user_id: user.id,
      entity_type: body.entity_type,
      risk_score: result.risk_score,
      risk_level: result.risk_level,
      reasons: result.reasons,
      raw_input: body,
      decision,
    });

    // 📤 RESPONSE
    return new Response(JSON.stringify({ ...result, decision }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("error:", e);

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

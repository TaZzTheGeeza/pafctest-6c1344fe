import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) return json({ error: "Invalid token" }, 401);
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const allowed = new Set(["admin", "coach", "manager", "news_editor"]);
    if (!roles?.some((r: any) => allowed.has(r.role))) return json({ error: "Forbidden" }, 403);

    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size < 2048) {
      return json({ error: "That recording was empty — please try again." }, 400);
    }
    if (audio.size > 20 * 1024 * 1024) {
      return json({ error: "Recording is too long. Please keep it under a couple of minutes." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI service not configured" }, 500);

    const upstream = new FormData();
    upstream.append("model", "openai/gpt-4o-mini-transcribe");
    upstream.append("file", audio, "recording.wav");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("Transcription error:", res.status, t);
      if (res.status === 429) return json({ error: "AI is busy right now, please try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "AI credits exhausted. Please top up in workspace settings." }, 402);
      return json({ error: "Could not understand that recording, please try again." }, 502);
    }

    const data = await res.json();
    return json({ text: (data.text || "").trim() });
  } catch (e) {
    console.error("transcribe-match-note error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

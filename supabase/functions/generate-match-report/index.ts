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

    const body = await req.json().catch(() => ({}));
    const {
      teamName = "",
      opponent = "",
      isHome = true,
      homeScore = 0,
      awayScore = 0,
      matchDate = "",
      scorers = "",
      assists = "",
      potm = "",
      notes = "",
      tone = "standard",
      mode = "report",
      playerName = "",
    } = body ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI service not configured" }, 500);

    if (mode === "potm") {
      if (!playerName) return json({ error: "Pick the player first." }, 400);
      const potmFacts = [
        `Player: ${playerName}`,
        `Team: ${teamName}`,
        opponent ? `Opponent: ${opponent}` : "",
        `Venue: ${isHome ? "home" : "away"}`,
        `Final score: ${isHome ? homeScore : awayScore} - ${isHome ? awayScore : homeScore}`,
        matchDate ? `Date: ${matchDate}` : "",
        scorers ? `Goal scorers: ${scorers}` : "",
        assists ? `Assists: ${assists}` : "",
        notes ? `Coach's rough notes about this player (main source of detail): ${notes}` : "",
      ].filter(Boolean).join("\n");

      const potmTone =
        tone === "short"
          ? "Write ONE short sentence."
          : tone === "upbeat"
          ? "Write 2 short sentences in a warm, celebratory tone."
          : "Write 2 short sentences (around 25-45 words).";

      const potmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You write short Player of the Match citations for a grassroots youth football club (Peterborough Athletic FC), read by parents and children. British English, warm, encouraging and age-appropriate. Use ONLY the facts given — never invent goals, incidents or other players. Address the player by first name. Return plain text only: no markdown, no headings, no quotes.",
            },
            { role: "user", content: `${potmTone}\n\nFacts:\n${potmFacts}` },
          ],
        }),
      });

      if (!potmRes.ok) {
        if (potmRes.status === 429) return json({ error: "AI is busy right now, please try again in a moment." }, 429);
        if (potmRes.status === 402) return json({ error: "AI credits exhausted. Please top up in workspace settings." }, 402);
        console.error("AI gateway error:", potmRes.status, await potmRes.text());
        return json({ error: "Failed to generate the write-up" }, 500);
      }
      const potmData = await potmRes.json();
      const potmText = (potmData.choices?.[0]?.message?.content || "").trim();
      if (!potmText) return json({ error: "The AI returned an empty write-up, please try again." }, 502);
      return json({ report: potmText });
    }

    const ourScore = isHome ? homeScore : awayScore;
    const theirScore = isHome ? awayScore : homeScore;
    const outcome = ourScore > theirScore ? "win" : ourScore < theirScore ? "defeat" : "draw";

    const toneHint =
      tone === "short"
        ? "Write 2-3 short sentences only."
        : tone === "upbeat"
        ? "Write 2 short paragraphs in a warm, encouraging tone suitable for young players and their parents."
        : "Write 2 short paragraphs (around 90-140 words total).";

    const facts = [
      `Our team: ${teamName}`,
      `Opponent: ${opponent}`,
      `Venue: ${isHome ? "home" : "away"}`,
      `Final score: ${teamName} ${ourScore} - ${theirScore} ${opponent} (a ${outcome})`,
      matchDate ? `Date: ${matchDate}` : "",
      scorers ? `Goal scorers: ${scorers}` : "No goal scorers recorded",
      assists ? `Assists: ${assists}` : "",
      potm ? `Player of the Match: ${potm}` : "",
      notes ? `Coach's rough notes (use these as the main source of detail): ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You write short grassroots youth football match reports for Peterborough Athletic FC (The Lions), read by parents and players. British English, positive and age-appropriate, never critical of individual children or the opposition, never mention referees negatively. Use ONLY the facts given - never invent players, goals, times or incidents. Return plain text only: no markdown, no headings, no bullet points, no title.",
          },
          { role: "user", content: `${toneHint}\n\nMatch facts:\n${facts}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "AI is busy right now, please try again in a moment." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted. Please top up in workspace settings." }, 402);
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return json({ error: "Failed to generate the report" }, 500);
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content || "").trim();
    if (!text) return json({ error: "The AI returned an empty report, please try again." }, 502);

    return json({ report: text });
  } catch (e) {
    console.error("generate-match-report error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

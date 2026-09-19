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

const QUESTION_TYPES = ["multiple_choice", "multi_select", "written", "true_false", "number"];

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
    const allowed = new Set(["admin", "coach", "manager"]);
    if (!roles?.some((r: any) => allowed.has(r.role))) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const idea = String(body?.idea || "").trim();
    const teamName = String(body?.teamName || "").trim();
    const ageHint = String(body?.ageHint || "").trim();
    const questionCount = Math.min(Math.max(Number(body?.questionCount ?? 3), 0), 6);
    const includeQuestions = questionCount > 0;

    if (!idea) return json({ error: "Tell the AI what you want them to practise first." }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI service not configured" }, 500);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You help a grassroots youth football coach at Peterborough Athletic FC turn a short idea into a ready-to-set homework task for children and their parents. British English, warm, simple and age-appropriate. Keep the practice safe, doable at home or in a garden/park with one ball, and give clear repetitions or a time. Never invent club events or fixtures. Reply with JSON only.",
          },
          {
            role: "user",
            content: [
              `Coach's idea: ${idea}`,
              teamName ? `Team: ${teamName}` : "",
              ageHint ? `Age group: ${ageHint}` : "",
              "",
              "Return json in exactly this shape:",
              '{"title": string, "description": string, "questions": [{"question_type": "multiple_choice|multi_select|written|true_false|number", "prompt": string, "options": string[], "correct": string[], "required": boolean}]}',
              "",
              "Rules:",
              "- title: short and punchy, under 60 characters.",
              `- description: 2-4 short sentences telling the child exactly what to practise, how many reps, and what to film or note.`,
              includeQuestions
                ? `- questions: exactly ${questionCount} simple check-in questions about the drill or how it went. Mix the types. multiple_choice and multi_select need 3-4 options; true_false uses options ["True","False"]; written and number use an empty options array. Put the correct option(s) in "correct" when there is a right answer, otherwise use an empty array (e.g. opinion questions). Keep every prompt child-friendly.`
                : '- questions: return an empty array [].',
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return json({ error: "AI is busy right now, please try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "AI credits exhausted. Please top up in workspace settings." }, 402);
      console.error("AI gateway error:", res.status, await res.text().catch(() => ""));
      return json({ error: "Could not build that homework, please try again." }, 500);
    }

    const data = await res.json();
    const raw = (data.choices?.[0]?.message?.content || "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim());
    } catch {
      console.error("Unparseable AI output:", raw.slice(0, 500));
      return json({ error: "The AI reply was not usable, please try again." }, 502);
    }

    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const cleaned = questions
      .slice(0, 6)
      .map((q: any) => {
        const type = QUESTION_TYPES.includes(q?.question_type) ? q.question_type : "written";
        const options =
          type === "true_false"
            ? ["True", "False"]
            : type === "multiple_choice" || type === "multi_select"
              ? (Array.isArray(q?.options) ? q.options : []).map((o: any) => String(o).trim()).filter(Boolean).slice(0, 6)
              : [];
        const correct = (Array.isArray(q?.correct) ? q.correct : [])
          .map((c: any) => String(c).trim())
          .filter((c: string) => c && (!options.length || options.includes(c)));
        return {
          question_type: type,
          prompt: String(q?.prompt || "").trim(),
          options,
          correct: type === "multiple_choice" || type === "true_false" ? correct.slice(0, 1) : correct,
          required: q?.required !== false,
        };
      })
      .filter((q: any) => q.prompt && (!["multiple_choice", "multi_select"].includes(q.question_type) || q.options.length >= 2));

    const title = String(parsed?.title || "").trim().slice(0, 120);
    const description = String(parsed?.description || "").trim();
    if (!title && !description) return json({ error: "The AI returned nothing usable, please try again." }, 502);

    return json({ title, description, questions: cleaned });
  } catch (e) {
    console.error("generate-homework error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

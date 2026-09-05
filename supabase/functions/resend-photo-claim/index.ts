import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") throw new Error("email is required");
    const normEmail = email.trim().toLowerCase();

    // Find most recent claim for this email
    const { data: existing } = await admin
      .from("photo_claim_tokens")
      .select("*")
      .ilike("email", normEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Always respond with success (don't reveal whether email is registered)
    if (!existing) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Issue a new token tied to the same photo list (extends expiry)
    const token = genToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insErr } = await admin.from("photo_claim_tokens").insert({
      token,
      email: existing.email,
      shopify_order_id: existing.shopify_order_id,
      photo_ids: existing.photo_ids,
      expires_at: expiresAt,
    });
    if (insErr) throw insErr;

    const origin = req.headers.get("origin") || "https://www.pa-fc.uk";
    const claimUrl = `${origin}/photos/claim?token=${token}`;

    const { error: emailError } = await admin.functions.invoke("send-app-email", {
      body: {
        templateName: "photo-claim-link",
        recipientEmail: existing.email,
        idempotencyKey: `photo-resend-${token}`,
        templateData: {
          claimUrl,
          photoCount: String((existing.photo_ids || []).length),
          orderName: existing.shopify_order_id || "",
        },
      },
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

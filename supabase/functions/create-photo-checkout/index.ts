import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";
const PHOTO_PRICE_PENCE = 200; // £2.00 per photo

async function gcPost(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${GC_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "GoCardless-Version": "2015-07-06",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const body = await req.json();
    const { photo_id, photo_ids } = body;
    let buyerName: string = (body.buyer_name || "").trim();
    let buyerEmail: string = (body.buyer_email || "").trim().toLowerCase();

    const ids: string[] = photo_ids?.length ? photo_ids : (photo_id ? [photo_id] : []);
    if (ids.length === 0) throw new Error("photo_id or photo_ids is required");
    if (ids.length > 50) throw new Error("Too many photos in a single checkout");

    // Optional auth
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        if (!buyerEmail && data.user.email) buyerEmail = data.user.email.toLowerCase();
        if (!buyerName) {
          const { data: profile } = await adminClient
            .from("profiles").select("full_name").eq("id", userId).maybeSingle();
          if (profile?.full_name) buyerName = profile.full_name;
        }
      }
    }

    if (!buyerEmail) throw new Error("Email is required to send your download link");
    if (!buyerName) buyerName = "PAFC Supporter";

    // Confirm photos exist
    const { data: photos, error: photosErr } = await adminClient
      .from("tournament_photos")
      .select("id")
      .in("id", ids);
    if (photosErr || !photos || photos.length !== ids.length) {
      throw new Error("One or more photos not found");
    }

    // Exclude already-purchased for logged-in users
    let finalIds = [...ids];
    if (userId) {
      const { data: existing } = await adminClient
        .from("tournament_photo_purchases")
        .select("photo_id").eq("user_id", userId).in("photo_id", ids);
      const purchased = new Set((existing || []).map((p: any) => p.photo_id));
      finalIds = finalIds.filter((id) => !purchased.has(id));
      if (finalIds.length === 0) throw new Error("You already own these photos");
    }

    const totalPence = PHOTO_PRICE_PENCE * finalIds.length;
    const origin = req.headers.get("origin") || "https://www.pa-fc.uk";

    // Create a pending claim token first so we have a stable handle to return to
    const claimToken = genToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create Instant Bank Pay billing request (payment_request only with faster_payments scheme)
    const brResponse = await gcPost("/billing_requests", {
      billing_requests: {
        payment_request: {
          description: `PAFC Tournament Photo${finalIds.length > 1 ? "s" : ""} (${finalIds.length})`,
          amount: totalPence,
          currency: "GBP",
          scheme: "faster_payments",
          metadata: {
            kind: "tournament_photos",
            claim_token: claimToken,
            photo_count: String(finalIds.length),
          },
        },
      },
    }, gcToken);

    const billingRequestId = brResponse.billing_requests.id;

    const { error: insErr } = await adminClient.from("photo_claim_tokens").insert({
      token: claimToken,
      email: buyerEmail,
      buyer_name: buyerName,
      shopify_order_id: billingRequestId, // reused as provider ref
      provider: "gocardless",
      photo_ids: finalIds,
      total_cents: totalPence,
      expires_at: expiresAt,
    });
    if (insErr) throw new Error("Could not create claim record: " + insErr.message);

    // Create hosted billing request flow (Instant Bank Pay PIS checkout)
    const brfResponse = await gcPost("/billing_request_flows", {
      billing_request_flows: {
        redirect_uri: `${origin}/photos/claim?token=${claimToken}`,
        exit_uri: `${origin}/tournament?tab=photos&cancelled=true`,
        prefilled_customer: {
          email: buyerEmail,
          given_name: buyerName.split(" ")[0] || buyerName,
          family_name: buyerName.split(" ").slice(1).join(" ") || "",
        },
        links: {
          billing_request: billingRequestId,
        },
      },
    }, gcToken);

    // Email the magic claim link immediately so the buyer has it even if the
    // browser is closed mid-payment. The link only unlocks downloads once
    // GoCardless confirms payment, but the email gets it to them safely.
    try {
      // Look up photo refs for the email body
      const { data: photoRows } = await adminClient
        .from("tournament_photos")
        .select("photo_ref")
        .in("id", finalIds);
      const refs = (photoRows || []).map((p: any) => p.photo_ref).filter(Boolean).join(", ");
      const claimUrl = `${origin}/photos/claim?token=${claimToken}`;
      const { error: emailErr } = await adminClient.functions.invoke("send-app-email", {
        body: {
          templateName: "photo-claim-link",
          recipientEmail: buyerEmail,
          idempotencyKey: `photo-link-${claimToken}`,
          templateData: {
            claimUrl,
            photoCount: String(finalIds.length),
            orderName: billingRequestId,
            photoRefs: refs,
          },
        },
      });
      if (emailErr) console.error("photo-claim checkout email failed:", emailErr);
    } catch (e) {
      console.error("photo-claim checkout email threw:", e);
    }

    return new Response(JSON.stringify({
      url: brfResponse.billing_request_flows.authorisation_url,
      token: claimToken,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("create-photo-checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

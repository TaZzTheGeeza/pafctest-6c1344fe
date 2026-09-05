import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function handlePaidSession(stripe: Stripe, admin: ReturnType<typeof createClient>, session: any, origin: string) {
  const md = session.metadata || {};
  if (md.kind !== "tournament_photos") return;

  const photoIds = String(md.photo_ids || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (photoIds.length === 0) return;

  const userId: string = md.user_id || "";
  const email: string | null = session.customer_details?.email || session.customer_email || null;

  if (userId) {
    // Logged-in buyer: record purchases, no email needed
    for (const photoId of photoIds) {
      await admin
        .from("tournament_photo_purchases")
        .upsert(
          { photo_id: photoId, user_id: userId, stripe_session_id: session.id },
          { onConflict: "user_id,photo_id" }
        );
    }
    return;
  }

  if (!email) return;

  // Guest: create claim token + email magic link
  const token = genToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error: insErr } = await admin.from("photo_claim_tokens").insert({
    token,
    email,
    shopify_order_id: session.id, // reusing field for stripe session id
    photo_ids: photoIds,
    expires_at: expiresAt,
  });
  if (insErr) {
    console.error("Failed to insert claim token:", insErr);
    return;
  }

  const claimUrl = `${origin.replace(/\/$/, "")}/photos/claim?token=${token}`;
  await admin.functions.invoke("send-app-email", {
    body: {
      templateName: "photo-claim-link",
      recipientEmail: email,
      idempotencyKey: `photo-claim-${session.id}`,
      templateData: {
        claimUrl,
        photoCount: String(photoIds.length),
        orderName: `Order ${session.id.slice(-8)}`,
      },
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
      return new Response("Misconfigured", { status: 500, headers: corsHeaders });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const sig = req.headers.get("stripe-signature") || "";
    const raw = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
    } catch (e: any) {
      console.error("Signature verification failed:", e.message);
      return new Response("Bad signature", { status: 400, headers: corsHeaders });
    }

    const origin =
      Deno.env.get("PUBLIC_SITE_URL") ||
      req.headers.get("origin") ||
      "https://www.pa-fc.uk";

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        await handlePaidSession(stripe, admin, session, origin);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("stripe-photo-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

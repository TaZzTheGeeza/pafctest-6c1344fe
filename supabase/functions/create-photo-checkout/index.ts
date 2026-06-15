import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { photo_id, photo_ids } = await req.json();
    const ids: string[] = photo_ids?.length ? photo_ids : (photo_id ? [photo_id] : []);
    if (ids.length === 0) throw new Error("photo_id or photo_ids is required");
    if (ids.length > 50) throw new Error("Too many photos in a single checkout");

    // Optional auth — guest checkout supported
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    // Fetch photos to confirm they exist
    const { data: photos, error: photosErr } = await adminClient
      .from("tournament_photos")
      .select("id")
      .in("id", ids);
    if (photosErr || !photos || photos.length !== ids.length) {
      throw new Error("One or more photos not found");
    }

    // If logged in, exclude photos already purchased
    if (userId) {
      const { data: existing } = await adminClient
        .from("tournament_photo_purchases")
        .select("photo_id")
        .eq("user_id", userId)
        .in("photo_id", ids);
      const purchased = new Set((existing || []).map((p: any) => p.photo_id));
      const remaining = ids.filter((id) => !purchased.has(id));
      if (remaining.length === 0) throw new Error("You already own these photos");
      ids.length = 0;
      ids.push(...remaining);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://www.pa-fc.uk";

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail || undefined,
      line_items: [
        {
          price: "price_1THiX3CLdtMESt0qE4eB3R7D", // £2.00 Tournament Photo
          quantity: ids.length,
        },
      ],
      mode: "payment",
      metadata: {
        kind: "tournament_photos",
        photo_ids: ids.join(","),
        user_id: userId || "",
      },
      payment_intent_data: {
        metadata: {
          kind: "tournament_photos",
          photo_ids: ids.join(","),
          user_id: userId || "",
        },
      },
      success_url: `${origin}/photos/claim?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tournament?tab=photos`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

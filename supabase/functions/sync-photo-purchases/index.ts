import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "peterborough-athletic-hub-7u7sl.myshopify.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user?.email) throw new Error("Not authenticated");

    // Query Shopify Admin API for orders matching the user's email
    const shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    if (!shopifyToken) throw new Error("Shopify not configured");

    const ordersRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-07/orders.json?email=${encodeURIComponent(user.email)}&status=any&limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!ordersRes.ok) {
      throw new Error(`Shopify API error: ${ordersRes.status}`);
    }

    const { orders } = await ordersRes.json();
    const synced: string[] = [];

    for (const order of orders || []) {
      if (order.financial_status !== "paid") continue;

      for (const li of order.line_items || []) {
        if (li.sku !== "TOURNAMENT-PHOTO") continue;

        const photoId = li.properties?.find((p: any) => p.name === "photo_id")?.value;
        const userId = li.properties?.find((p: any) => p.name === "user_id")?.value;

        // Match either by user_id property or by the authenticated user
        const effectiveUserId = userId || user.id;
        if (userId && userId !== user.id) continue; // Don't claim someone else's purchase

        if (photoId) {
          const { error } = await adminClient
            .from("tournament_photo_purchases")
            .upsert(
              {
                photo_id: photoId,
                user_id: effectiveUserId,
                stripe_session_id: `shopify-${order.id}`,
              },
              { onConflict: "user_id,photo_id" }
            );
          if (!error) synced.push(photoId);
        }
      }
    }

    // Now fetch the user's purchases with photo details
    const { data: purchases } = await adminClient
      .from("tournament_photo_purchases")
      .select("*, tournament_photos(id, preview_url, storage_path, caption, age_group)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return new Response(
      JSON.stringify({ synced_count: synced.length, purchases: purchases || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("sync-photo-purchases error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

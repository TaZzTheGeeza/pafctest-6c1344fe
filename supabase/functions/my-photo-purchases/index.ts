import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "peterborough-athletic-hub-7u7sl.myshopify.com";

function resolveShopifyToken(): string | null {
  let token = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || Deno.env.get("SHOPIFY_ONLINE_ACCESS_TOKEN");
  if (!token) {
    for (const [key, value] of Object.entries(Deno.env.toObject())) {
      if (key.startsWith("SHOPIFY_ONLINE_ACCESS_TOKEN") && value) {
        token = value;
        break;
      }
    }
  }
  return token || null;
}

async function syncFromShopify(
  adminClient: any,
  userId: string,
  email: string,
) {
  const shopifyToken = resolveShopifyToken();
  if (!shopifyToken) {
    console.warn("No Shopify access token available, skipping sync");
    return 0;
  }

  try {

    const ordersRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2025-07/orders.json?email=${encodeURIComponent(email)}&status=any&limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
      },
    );
    if (!ordersRes.ok) {
      console.error("Shopify orders API error:", ordersRes.status, await ordersRes.text());
      return 0;
    }
    const { orders } = await ordersRes.json();
    let synced = 0;
    for (const order of orders || []) {
      if (order.financial_status !== "paid") continue;
      for (const li of order.line_items || []) {
        // Match by SKU OR by presence of a photo_id property (more forgiving)
        const photoIdProp = li.properties?.find((p: any) => p.name === "photo_id")?.value;
        const userIdProp = li.properties?.find((p: any) => p.name === "user_id")?.value;
        const isPhotoLine = li.sku === "TOURNAMENT-PHOTO" || !!photoIdProp;
        if (!isPhotoLine || !photoIdProp) continue;
        // Don't claim someone else's purchase if a different user_id was attached
        if (userIdProp && userIdProp !== userId) continue;
        const { error } = await adminClient
          .from("tournament_photo_purchases")
          .upsert(
            {
              photo_id: photoIdProp,
              user_id: userId,
              stripe_session_id: `shopify-${order.id}`,
            },
            { onConflict: "user_id,photo_id" },
          );
        if (!error) synced++;
      }
    }
    return synced;
  } catch (e) {
    console.error("syncFromShopify error:", e);
    return 0;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error("Not authenticated");

    const { action, photo_id } = await req.json();

    if (action === "list") {
      // Pull latest paid orders from Shopify and upsert any photo purchases first
      if (user.email) {
        const synced = await syncFromShopify(adminClient, user.id, user.email);
        if (synced > 0) console.log(`Synced ${synced} photo purchase(s) for ${user.email}`);
      }

      const { data: purchases, error } = await adminClient
        .from("tournament_photo_purchases")
        .select(
          "id, created_at, download_count, photo_id, tournament_photos(id, preview_url, storage_path, caption, age_group)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ purchases: purchases || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "download" && photo_id) {
      const { data: purchase } = await adminClient
        .from("tournament_photo_purchases")
        .select("id, download_count")
        .eq("user_id", user.id)
        .eq("photo_id", photo_id)
        .single();

      if (!purchase) throw new Error("Purchase not found");

      const { data: photo } = await adminClient
        .from("tournament_photos")
        .select("storage_path")
        .eq("id", photo_id)
        .single();

      if (!photo) throw new Error("Photo not found");

      const { data: signedUrl, error: signErr } = await adminClient.storage
        .from("tournament-photos")
        .createSignedUrl(photo.storage_path, 3600);

      if (signErr) throw signErr;

      await adminClient
        .from("tournament_photo_purchases")
        .update({ download_count: ((purchase as any).download_count || 0) + 1 })
        .eq("id", (purchase as any).id);

      return new Response(JSON.stringify({ download_url: signedUrl.signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

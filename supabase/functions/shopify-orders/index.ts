import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_STORE = "peterborough-athletic-hub-7u7sl.myshopify.com";
const SHOPIFY_API_VERSION = "2024-10";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: hasAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer a dedicated admin token if provided; otherwise fall back to connector tokens.
    let SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ADMIN_API_TOKEN")
      || Deno.env.get("SHOPIFY_ONLINE_ACCESS_TOKEN")
      || Deno.env.get("SHOPIFY_ACCESS_TOKEN");
    if (!SHOPIFY_ACCESS_TOKEN) {
      // Search for user-scoped online access tokens (format: SHOPIFY_ONLINE_ACCESS_TOKEN:user:xxx)
      for (const [key, value] of Object.entries(Deno.env.toObject())) {
        if (key.startsWith("SHOPIFY_ONLINE_ACCESS_TOKEN") || key.startsWith("SHOPIFY_ADMIN_API_TOKEN")) {
          SHOPIFY_ACCESS_TOKEN = value;
          break;
        }
      }
    }
    if (!SHOPIFY_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Shopify not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tokenSource = Deno.env.get("SHOPIFY_ADMIN_API_TOKEN") ? "SHOPIFY_ADMIN_API_TOKEN" : "fallback";
    console.log("Using Shopify token source:", tokenSource, "prefix:", SHOPIFY_ACCESS_TOKEN.slice(0, 7));

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "any";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 250);
    const sinceId = url.searchParams.get("since_id") || "";

    let endpoint = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=${limit}&status=${status}&order=created_at+desc`;
    if (sinceId) endpoint += `&since_id=${sinceId}`;

    const shopifyRes = await fetch(endpoint, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!shopifyRes.ok) {
      const errText = await shopifyRes.text();
      console.error("Shopify API error:", shopifyRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Shopify API error: ${shopifyRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await shopifyRes.json();
    const orders = data.orders || [];

    // Persist to shopify_orders so the dashboard has a durable record even if
    // the Shopify webhook never fired (e.g. webhook secret not configured).
    let synced = 0;
    if (orders.length > 0) {
      const rows = orders.map((o: any) => ({
        shopify_order_id: o.id,
        order_name: o.name || `#${o.order_number}`,
        order_number: o.order_number,
        email: o.email || null,
        customer_first_name: o.customer?.first_name || null,
        customer_last_name: o.customer?.last_name || null,
        customer_email: o.customer?.email || null,
        financial_status: o.financial_status || "pending",
        fulfillment_status: o.fulfillment_status || null,
        total_price: parseFloat(o.total_price || "0"),
        currency: o.currency || "GBP",
        line_items: (o.line_items || []).map((li: any) => ({
          id: li.id,
          title: li.title,
          variant_title: li.variant_title || null,
          quantity: li.quantity,
          price: li.price,
          properties: li.properties || [],
        })),
        cancelled_at: o.cancelled_at || null,
        shopify_created_at: o.created_at,
        updated_at: new Date().toISOString(),
      }));
      const { error: upErr } = await adminClient
        .from("shopify_orders")
        .upsert(rows, { onConflict: "shopify_order_id" });
      if (upErr) console.error("shopify_orders upsert failed:", upErr.message);
      else synced = rows.length;
    }

    return new Response(JSON.stringify({ ...data, synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("shopify-orders error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

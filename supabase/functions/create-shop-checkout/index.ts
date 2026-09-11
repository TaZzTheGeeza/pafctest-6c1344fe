import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

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

interface CartItem {
  product_id: string;
  quantity: number;
  size?: string | null;
  initials?: string | null;
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
    const items: CartItem[] = body.items;
    let buyerName: string = (body.buyer_name || "").trim();
    let buyerEmail: string = (body.buyer_email || "").trim().toLowerCase();

    if (!Array.isArray(items) || items.length === 0) throw new Error("Your basket is empty");
    if (items.length > 30) throw new Error("Too many items in one order");

    // Optional auth - prefill buyer details when signed in
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

    if (!buyerEmail) throw new Error("Email is required for your order confirmation");
    if (!buyerName) throw new Error("Name is required");

    // Validate items against live product data - never trust client prices
    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: products, error: prodErr } = await adminClient
      .from("shop_products")
      .select("id, name, price_cents, sizes, requires_initials, active")
      .in("id", productIds);
    if (prodErr) throw prodErr;
    const productMap = new Map((products || []).map((p: any) => [p.id, p]));

    const orderItems: any[] = [];
    let totalPence = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id) as any;
      if (!product || !product.active) throw new Error("One of the items is no longer available");
      const qty = Math.floor(Number(item.quantity));
      if (!qty || qty < 1 || qty > 20) throw new Error("Invalid quantity");
      const size = (item.size || "").trim() || null;
      if (product.sizes?.length > 0 && !size) throw new Error(`Please choose a size for ${product.name}`);
      if (size && product.sizes?.length > 0 && !product.sizes.includes(size)) {
        throw new Error(`Invalid size for ${product.name}`);
      }
      const initials = (item.initials || "").trim().toUpperCase().slice(0, 4) || null;
      if (product.requires_initials && !initials) throw new Error(`Please add initials for ${product.name}`);
      totalPence += product.price_cents * qty;
      orderItems.push({
        product_id: product.id,
        name: product.name,
        size,
        initials,
        quantity: qty,
        price_cents: product.price_cents,
      });
    }

    const origin = req.headers.get("origin") || "https://www.pa-fc.uk";

    // Create pending order first so we have a stable ID
    const { data: order, error: orderErr } = await adminClient
      .from("shop_orders")
      .insert({
        user_id: userId,
        email: buyerEmail,
        customer_name: buyerName,
        items: orderItems,
        total_cents: totalPence,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderErr) throw new Error("Could not create order: " + orderErr.message);

    const itemSummary = orderItems
      .map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}`)
      .join(", ");

    // GoCardless Instant Bank Pay billing request
    const brResponse = await gcPost("/billing_requests", {
      billing_requests: {
        payment_request: {
          description: `PAFC Club Shop - ${itemSummary}`.slice(0, 255),
          amount: totalPence,
          currency: "GBP",
          scheme: "faster_payments",
          metadata: {
            kind: "shop_order",
            order_id: order.id,
          },
        },
      },
    }, gcToken);

    const billingRequestId = brResponse.billing_requests.id;

    await adminClient
      .from("shop_orders")
      .update({ gocardless_billing_request_id: billingRequestId })
      .eq("id", order.id);

    const brfResponse = await gcPost("/billing_request_flows", {
      billing_request_flows: {
        redirect_uri: `${origin}/shop/complete?order=${order.id}&br=${billingRequestId}`,
        exit_uri: `${origin}/shop?cancelled=true`,
        prefilled_customer: {
          email: buyerEmail,
          given_name: buyerName.split(" ")[0] || buyerName,
          family_name: buyerName.split(" ").slice(1).join(" ") || "",
        },
        links: { billing_request: billingRequestId },
      },
    }, gcToken);

    return new Response(JSON.stringify({
      url: brfResponse.billing_request_flows.authorisation_url,
      order_id: order.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("create-shop-checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

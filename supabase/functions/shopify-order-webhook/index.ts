import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const orderName = body.name || `#${body.order_number}`;
    const customerName =
      body.customer
        ? `${body.customer.first_name || ""} ${body.customer.last_name || ""}`.trim()
        : body.email || "Unknown";
    const totalPrice = body.total_price || "0.00";
    const currency = body.currency || "GBP";
    const itemCount = (body.line_items || []).length;

    const title = `🛒 New Order ${orderName}`;
    const message = `${customerName} placed an order for ${itemCount} item${itemCount !== 1 ? "s" : ""} — ${currency} ${totalPrice}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all admin user IDs
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = [...new Set((adminRoles ?? []).map((r) => r.user_id))];

    if (adminIds.length > 0) {
      // In-app notifications
      const notifications = adminIds.map((uid) => ({
        user_id: uid,
        title,
        message,
        type: "shop_order",
        link: "/dashboard?section=orders",
      }));
      await supabase.from("hub_notifications").insert(notifications);

      // Email notifications
      for (const uid of adminIds) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", uid)
          .single();

        if (profile?.email) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "shop-order-notification",
              recipientEmail: profile.email,
              idempotencyKey: `shop-order-${body.id}-${uid}`,
              templateData: {
                orderName,
                customerName,
                totalPrice: `${currency} ${totalPrice}`,
                itemCount: String(itemCount),
              },
            },
          });
        }
      }

      // Push notifications
      await supabase.functions.invoke("send-push-notification", {
        body: {
          userIds: adminIds,
          title,
          message,
          tag: `shop-order-${body.id}`,
        },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("shopify-order-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

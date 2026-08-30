import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain",
};

async function verifyShopifyHmac(rawBody: string, hmacHeader: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBytes = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)),
    );
    let b64 = "";
    sigBytes.forEach((b) => (b64 += String.fromCharCode(b)));
    const expected = btoa(b64);
    // constant-time-ish comparison
    if (expected.length !== hmacHeader.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
    return diff === 0;
  } catch (e) {
    console.error("HMAC verification error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256") || "";
    const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not configured — rejecting webhook");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!hmacHeader) {
      return new Response(JSON.stringify({ error: "Missing HMAC header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ok = await verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Invalid HMAC signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = JSON.parse(rawBody);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const orderName = body.name || `#${body.order_number}`;
    const customerName =
      body.customer
        ? `${body.customer.first_name || ""} ${body.customer.last_name || ""}`.trim()
        : body.email || "Unknown";
    const totalPrice = body.total_price || "0.00";
    const currency = body.currency || "GBP";
    const itemCount = (body.line_items || []).length;

    // Store order in database (upsert to handle duplicate webhooks)
    const lineItems = (body.line_items || []).map((li: any) => ({
      id: li.id,
      title: li.title,
      variant_title: li.variant_title || null,
      quantity: li.quantity,
      price: li.price,
    }));

    await supabase
      .from("shopify_orders")
      .upsert(
        {
          shopify_order_id: body.id,
          order_name: orderName,
          order_number: body.order_number,
          email: body.email || null,
          customer_first_name: body.customer?.first_name || null,
          customer_last_name: body.customer?.last_name || null,
          customer_email: body.customer?.email || null,
          financial_status: body.financial_status || "pending",
          fulfillment_status: body.fulfillment_status || null,
          total_price: parseFloat(totalPrice),
          currency,
          line_items: lineItems,
          cancelled_at: body.cancelled_at || null,
          shopify_created_at: body.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "shopify_order_id" }
      );

    // Handle tournament photo purchases from line item properties
    if (body.financial_status === "paid") {
      const guestPhotoIds: string[] = [];
      for (const li of body.line_items || []) {
        if (li.sku === "TOURNAMENT-PHOTO" && li.properties) {
          const photoId = li.properties.find((p: any) => p.name === "photo_id")?.value;
          const userId = li.properties.find((p: any) => p.name === "user_id")?.value;
          if (!photoId) continue;
          if (userId) {
            // Logged-in buyer: link purchase to their account
            await supabase
              .from("tournament_photo_purchases")
              .upsert(
                { photo_id: photoId, user_id: userId, stripe_session_id: `shopify-${body.id}` },
                { onConflict: "user_id,photo_id" }
              );
          } else {
            guestPhotoIds.push(photoId);
          }
        }
      }

      // Guest checkout: issue a magic-link claim token and email it
      const buyerEmail: string | null = body.email || body.customer?.email || null;
      if (guestPhotoIds.length > 0 && buyerEmail) {
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: claim } = await supabase
          .from("photo_claim_tokens")
          .insert({
            token,
            email: buyerEmail,
            shopify_order_id: orderName,
            photo_ids: guestPhotoIds,
            expires_at: expiresAt,
          })
          .select("id")
          .single();

        if (claim) {
          const origin =
            req.headers.get("origin") ||
            Deno.env.get("PUBLIC_SITE_URL") ||
            "https://www.pa-fc.uk";
          const claimUrl = `${origin.replace(/\/$/, "")}/photos/claim?token=${token}`;
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "photo-claim-link",
              recipientEmail: buyerEmail,
              idempotencyKey: `photo-claim-${body.id}`,
              templateData: {
                claimUrl,
                photoCount: String(guestPhotoIds.length),
                orderName,
              },
            },
          });
        }
      }
    }

    // Send notifications to admins
    const title = `🛒 New Order ${orderName}`;
    const message = `${customerName} placed an order for ${itemCount} item${itemCount !== 1 ? "s" : ""} — ${currency} ${totalPrice}`;

    // Roles that get notified about shop orders (configurable via site_settings)
    let notifyRoles = ["admin", "treasurer"];
    const { data: roleSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shop_order_notify_roles")
      .maybeSingle();
    if (roleSetting?.value) {
      const parsed = String(roleSetting.value).split(",").map((r: string) => r.trim()).filter(Boolean);
      if (parsed.length > 0) notifyRoles = parsed;
    }

    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", notifyRoles);

    const adminIds = [...new Set((adminRoles ?? []).map((r: any) => r.user_id))];


    if (adminIds.length > 0) {
      const notifications = adminIds.map((uid: string) => ({
        user_id: uid,
        title,
        message,
        type: "shop_order",
        link: "/dashboard?section=orders",
      }));
      await supabase.from("hub_notifications").insert(notifications);

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

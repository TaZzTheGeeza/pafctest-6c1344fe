import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GC_API = "https://api.gocardless.com";

async function gcGet(path: string, token: string) {
  const res = await fetch(`${GC_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "GoCardless-Version": "2015-07-06",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Called by the /shop/complete return page (and safe to call repeatedly).
// Checks the GoCardless billing request and marks the order paid once the
// bank payment has been collected/confirmed.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const { order_id, br_id } = await req.json();
    if (!order_id || !br_id) throw new Error("order_id and br_id are required");

    const { data: order, error: orderErr } = await adminClient
      .from("shop_orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.gocardless_billing_request_id !== br_id) throw new Error("Order mismatch");

    if (order.status === "paid") {
      return new Response(JSON.stringify({ status: "paid", order }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the billing request with its linked payment.
    // GoCardless exposes the payment under a few different keys depending on
    // the flow, so check all of them.
    const br = await gcGet(`/billing_requests/${br_id}`, gcToken);
    const billingRequest = br.billing_requests;
    const paymentId =
      billingRequest?.links?.payment ||
      billingRequest?.links?.payment_request_payment ||
      billingRequest?.payment_request?.links?.payment;

    if (!paymentId || billingRequest.status === "failed" || billingRequest.status === "cancelled") {
      if (billingRequest.status === "failed" || billingRequest.status === "cancelled") {
        await adminClient.from("shop_orders").update({ status: "cancelled" }).eq("id", order_id);
      }
      return new Response(JSON.stringify({
        status: billingRequest.status === "failed" || billingRequest.status === "cancelled" ? "cancelled" : "pending",
        flow_complete: billingRequest.status === "fulfilled",
        billing_request_status: billingRequest.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentRes = await gcGet(`/payments/${paymentId}`, gcToken);
    const payment = paymentRes.payments;

    // Instant Bank Pay: "paid_out" / "confirmed" mean money is secured.
    // "pending_submission"/"submitted" can still be treated as successful for PIS.
    const paidStates = ["confirmed", "paid_out", "submitted", "pending_submission"];
    if (!paidStates.includes(payment.status)) {
      return new Response(JSON.stringify({
        status: payment.status === "failed" || payment.status === "cancelled" ? "cancelled" : "pending",
        flow_complete: true,
        payment_status: payment.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await adminClient
      .from("shop_orders")
      .update({ status: "paid", gocardless_payment_id: paymentId })
      .eq("id", order_id)
      .eq("status", "pending");
    if (updErr) throw updErr;

    // Buyer confirmation email
    try {
      const itemsList = (order.items as any[])
        .map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}${i.initials ? ` — initials: ${i.initials}` : ""}`)
        .join("\n");
      const origin = new URL(req.url).origin;
      await adminClient.functions.invoke("send-app-email", {
        body: {
          templateName: "shop-order-confirmation",
          recipientEmail: order.email,
          idempotencyKey: `shop-order-${order.id}`,
          templateData: {
            customerName: order.customer_name,
            orderId: order.id.slice(0, 8).toUpperCase(),
            items: itemsList,
            total: (order.total_cents / 100).toFixed(2),
            ordersUrl: "https://www.pa-fc.uk/profile?tab=purchases",
          },
        },
      });
    } catch (e) {
      console.error("order confirmation email failed:", e);
    }

    // Notify admins/treasurer in-app
    try {
      const { data: admins } = await adminClient
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "treasurer"]);
      const notifications = (admins || []).map((a: any) => ({
        user_id: a.user_id,
        title: "New Shop Order",
        message: `${order.customer_name} — £${(order.total_cents / 100).toFixed(2)}`,
        type: "payment",
        link: "/dashboard?tab=orders",
      }));
      if (notifications.length > 0) {
        await adminClient.from("hub_notifications").insert(notifications);
      }
    } catch (e) {
      console.error("admin notification failed:", e);
    }

    return new Response(JSON.stringify({ status: "paid", order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("verify-shop-order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

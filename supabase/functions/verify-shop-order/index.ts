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

type Result = {
  status: "paid" | "pending" | "cancelled";
  flow_complete?: boolean;
  billing_request_status?: string;
  payment_status?: string;
  order?: any;
};

// Checks a single order against GoCardless and, when the payment has been
// collected, marks it paid + sends the confirmation email and admin alerts.
async function processOrder(adminClient: any, gcToken: string, order: any): Promise<Result> {
  const brId = order.gocardless_billing_request_id;
  if (!brId) return { status: "pending" };

  if (order.status === "paid") return { status: "paid", order };

  const br = await gcGet(`/billing_requests/${brId}`, gcToken);
  const billingRequest = br.billing_requests;
  const paymentId =
    billingRequest?.links?.payment ||
    billingRequest?.links?.payment_request_payment ||
    billingRequest?.payment_request?.links?.payment;

  if (!paymentId || billingRequest.status === "failed" || billingRequest.status === "cancelled") {
    if (billingRequest.status === "failed" || billingRequest.status === "cancelled") {
      await adminClient.from("shop_orders").update({ status: "cancelled" }).eq("id", order.id);
      return { status: "cancelled", billing_request_status: billingRequest.status };
    }
    return {
      status: "pending",
      flow_complete: billingRequest.status === "fulfilled",
      billing_request_status: billingRequest.status,
    };
  }

  const paymentRes = await gcGet(`/payments/${paymentId}`, gcToken);
  const payment = paymentRes.payments;

  const paidStates = ["confirmed", "paid_out", "submitted", "pending_submission"];
  if (!paidStates.includes(payment.status)) {
    if (payment.status === "failed" || payment.status === "cancelled") {
      await adminClient.from("shop_orders").update({ status: "cancelled" }).eq("id", order.id);
      return { status: "cancelled", flow_complete: true, payment_status: payment.status };
    }
    return { status: "pending", flow_complete: true, payment_status: payment.status };
  }

  // Only the update that actually flips pending -> paid should send the emails,
  // so repeated calls (page polling + the scheduled sweep) never double-send.
  const { data: updated, error: updErr } = await adminClient
    .from("shop_orders")
    .update({ status: "paid", gocardless_payment_id: paymentId })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (updErr) throw updErr;
  if (!updated) return { status: "paid", order };

  try {
    const itemsList = (order.items as any[])
      .map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}${i.initials ? ` - initials: ${i.initials}` : ""}`)
      .join("\n");
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
          ordersUrl: "https://www.pa-fc.uk/my-profile?tab=orders",
        },
      },
    });
  } catch (e) {
    console.error("order confirmation email failed:", e);
  }

  try {
    const { data: admins } = await adminClient
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "treasurer"]);
    const notifications = (admins || []).map((a: any) => ({
      user_id: a.user_id,
      title: "New Shop Order",
      message: `${order.customer_name} - £${(order.total_cents / 100).toFixed(2)}`,
      type: "payment",
      link: `/dashboard?section=orders&order=${encodeURIComponent(order.id)}`,
    }));
    if (notifications.length > 0) {
      await adminClient.from("hub_notifications").insert(notifications);
    }
  } catch (e) {
    console.error("admin notification failed:", e);
  }

  return { status: "paid", order };
}

// Called by the /shop/complete return page (safe to call repeatedly) and by a
// scheduled sweep so orders still get confirmed after the buyer closes the tab.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const body = await req.json().catch(() => ({}));

    // Scheduled sweep: check every recent pending order.
    if (body?.sweep) {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: pending, error } = await adminClient
        .from("shop_orders")
        .select("*")
        .eq("status", "pending")
        .not("gocardless_billing_request_id", "is", null)
        .gte("created_at", since)
        .limit(100);
      if (error) throw error;

      let paid = 0, cancelled = 0, stillPending = 0, failed = 0;
      for (const order of pending || []) {
        try {
          const result = await processOrder(adminClient, gcToken, order);
          if (result.status === "paid") paid++;
          else if (result.status === "cancelled") cancelled++;
          else stillPending++;
        } catch (e) {
          failed++;
          console.error("sweep failed for order", order.id, e);
        }
      }
      console.log(`sweep: checked ${(pending || []).length}, paid ${paid}, cancelled ${cancelled}, pending ${stillPending}, errors ${failed}`);
      return new Response(JSON.stringify({ checked: (pending || []).length, paid, cancelled, pending: stillPending, failed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_id, br_id } = body;
    if (!order_id || !br_id) throw new Error("order_id and br_id are required");

    const { data: order, error: orderErr } = await adminClient
      .from("shop_orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.gocardless_billing_request_id !== br_id) throw new Error("Order mismatch");

    const result = await processOrder(adminClient, gcToken, order);
    return new Response(JSON.stringify(result), {
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

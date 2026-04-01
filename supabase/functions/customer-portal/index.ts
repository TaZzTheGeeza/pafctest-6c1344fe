import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

async function findCustomerByEmail(email: string, token: string): Promise<string | null> {
  let after: string | undefined;
  while (true) {
    const query = after ? `?after=${after}&limit=100` : "?limit=100";
    const data = await gcGet(`/customers${query}`, token);
    const customers = data.customers || [];
    const match = customers.find((c: any) => c.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (!data.meta?.cursors?.after) break;
    after = data.meta.cursors.after;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
    if (!gcToken) throw new Error("GOCARDLESS_ACCESS_TOKEN not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const customerId = await findCustomerByEmail(user.email, gcToken);

    if (!customerId) {
      return new Response(JSON.stringify({ error: "No payment account found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get active subscriptions for this customer
    const subData = await gcGet(`/subscriptions?customer=${customerId}&status=active`, gcToken);
    const subscriptions = subData.subscriptions || [];

    return new Response(JSON.stringify({
      customer_id: customerId,
      subscriptions: subscriptions.map((s: any) => ({
        id: s.id,
        amount: s.amount,
        currency: s.currency,
        status: s.status,
        name: s.name,
        interval: s.interval_unit,
        start_date: s.start_date,
        upcoming_payments: s.upcoming_payments?.slice(0, 3) || [],
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    if (!user) throw new Error("Not authenticated");

    const { photo_id } = await req.json();
    if (!photo_id) throw new Error("photo_id is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for completed checkout sessions with this photo_id and user_id
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const matchingSession = sessions.data.find(
      (s) =>
        s.payment_status === "paid" &&
        s.metadata?.photo_id === photo_id &&
        s.metadata?.user_id === user.id
    );

    if (!matchingSession) {
      throw new Error("No completed payment found for this photo");
    }

    // Upsert purchase record
    const { error: upsertErr } = await adminClient
      .from("tournament_photo_purchases")
      .upsert(
        {
          user_id: user.id,
          photo_id,
          stripe_session_id: matchingSession.id,
        },
        { onConflict: "user_id,photo_id" }
      );
    if (upsertErr) throw new Error("Failed to record purchase");

    // Generate signed download URL
    const { data: photo } = await adminClient
      .from("tournament_photos")
      .select("storage_path")
      .eq("id", photo_id)
      .single();
    if (!photo) throw new Error("Photo not found");

    const { data: signedUrl, error: signErr } = await adminClient.storage
      .from("tournament-photos")
      .createSignedUrl(photo.storage_path, 3600); // 1 hour
    if (signErr) throw signErr;

    // Increment download count
    await adminClient.rpc("increment_download_count" as any, {
      p_user_id: user.id,
      p_photo_id: photo_id,
    });

    return new Response(
      JSON.stringify({ download_url: signedUrl.signedUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

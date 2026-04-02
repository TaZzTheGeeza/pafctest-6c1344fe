import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Verify purchase exists
    const { data: purchase } = await adminClient
      .from("tournament_photo_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("photo_id", photo_id)
      .maybeSingle();

    if (!purchase) throw new Error("You have not purchased this photo");

    // Get photo storage path
    const { data: photo } = await adminClient
      .from("tournament_photos")
      .select("storage_path")
      .eq("id", photo_id)
      .single();
    if (!photo) throw new Error("Photo not found");

    // Generate signed URL (1 hour)
    const { data: signedUrl, error: signErr } = await adminClient.storage
      .from("tournament-photos")
      .createSignedUrl(photo.storage_path, 3600);
    if (signErr) throw signErr;

    // Increment download count
    await adminClient
      .from("tournament_photo_purchases")
      .update({ download_count: purchase.id ? 1 : 1 })
      .eq("user_id", user.id)
      .eq("photo_id", photo_id);

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

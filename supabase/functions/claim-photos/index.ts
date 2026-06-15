import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { token, photo_id, session_id } = await req.json();
    if (!token && !session_id) throw new Error("token or session_id is required");

    let query = admin.from("photo_claim_tokens").select("*");
    if (token) query = query.eq("token", token);
    else query = query.eq("shopify_order_id", session_id).order("created_at", { ascending: false }).limit(1);

    const { data: claim, error } = await query.maybeSingle();

    if (error || !claim) throw new Error("Invalid or expired link");
    if (new Date(claim.expires_at).getTime() < Date.now()) {
      throw new Error("This download link has expired");
    }

    const photoIds: string[] = claim.photo_ids || [];
    if (photoIds.length === 0) throw new Error("No photos found for this link");

    // Fetch photo metadata
    const { data: photos } = await admin
      .from("tournament_photos")
      .select("id, caption, age_group, preview_url, storage_path")
      .in("id", photoIds);

    // If photo_id supplied, return a single signed URL (download action)
    if (photo_id) {
      if (!photoIds.includes(photo_id)) throw new Error("Photo not in this order");
      const p = (photos || []).find((x: any) => x.id === photo_id);
      if (!p) throw new Error("Photo not found");
      const { data: signed, error: sErr } = await admin.storage
        .from("tournament-photos")
        .createSignedUrl(p.storage_path, 3600);
      if (sErr) throw sErr;
      await admin
        .from("photo_claim_tokens")
        .update({ download_count: (claim.download_count || 0) + 1 })
        .eq("id", claim.id);
      return new Response(JSON.stringify({ download_url: signed.signedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Otherwise return the list with preview URLs (include token so client can switch to it)
    return new Response(
      JSON.stringify({
        token: claim.token,
        order_name: claim.shopify_order_id,
        email: claim.email,
        expires_at: claim.expires_at,
        photos: (photos || []).map((p: any) => ({
          id: p.id,
          caption: p.caption,
          age_group: p.age_group,
          preview_url: p.preview_url,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Failed to claim" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

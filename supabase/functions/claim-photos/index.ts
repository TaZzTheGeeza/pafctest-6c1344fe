import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GC_API = "https://api.gocardless.com";

async function getBillingRequestStatus(brId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`${GC_API}/billing_requests/${brId}`, {
      headers: { Authorization: `Bearer ${token}`, "GoCardless-Version": "2015-07-06" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.billing_requests?.status ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { token, photo_id } = await req.json();
    if (!token) throw new Error("token is required");

    const { data: claim, error } = await admin
      .from("photo_claim_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !claim) throw new Error("Invalid or expired link");
    if (new Date(claim.expires_at).getTime() < Date.now()) {
      throw new Error("This download link has expired");
    }

    // If not yet marked paid, check GoCardless status
    let justPaid = false;
    if (!claim.paid_at && claim.provider === "gocardless" && claim.shopify_order_id) {
      const gcToken = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
      if (!gcToken) throw new Error("Payment provider not configured");
      const status = await getBillingRequestStatus(claim.shopify_order_id, gcToken);

      if (status === "fulfilled" || status === "fulfilling" || status === "ready_to_fulfil") {
        const nowIso = new Date().toISOString();
        await admin.from("photo_claim_tokens").update({ paid_at: nowIso }).eq("id", claim.id);
        claim.paid_at = nowIso;
        justPaid = true;
      } else if (status === "cancelled") {
        return new Response(JSON.stringify({ error: "Payment was cancelled" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // pending / unknown — let client poll
        return new Response(JSON.stringify({ pending: true, status: status || "pending" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!claim.paid_at) {
      return new Response(JSON.stringify({ pending: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photoIds: string[] = claim.photo_ids || [];
    if (photoIds.length === 0) throw new Error("No photos found for this link");

    const { data: photos } = await admin
      .from("tournament_photos")
      .select("id, caption, age_group, preview_url, storage_path, photo_ref")
      .in("id", photoIds);

    // Send confirmation email when payment was just confirmed (idempotent — awaited so it actually fires)
    if (justPaid) {
      const origin = req.headers.get("origin") || "https://www.pa-fc.uk";
      const claimUrl = `${origin}/photos/claim?token=${claim.token}`;
      const refs = (photos || []).map((p: any) => p.photo_ref).filter(Boolean).join(", ");
      try {
        const { error: emailErr } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "photo-claim-link",
            recipientEmail: claim.email,
            idempotencyKey: `photo-paid-${claim.token}`,
            templateData: {
              claimUrl,
              photoCount: String(photoIds.length),
              orderName: claim.shopify_order_id || "",
              photoRefs: refs,
            },
          },
        });
        if (emailErr) console.error("photo-claim email send failed:", emailErr);
      } catch (e) {
        console.error("photo-claim email send threw:", e);
      }
    }

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
          photo_ref: p.photo_ref,
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

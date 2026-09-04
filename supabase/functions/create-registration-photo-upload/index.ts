import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const allowedExtensions = new Set(["jpg", "jpeg", "png", "heic", "heif", "webp", "gif", "bmp", "tif", "tiff"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Please sign in again before uploading the photo." }, 401);

    const body = await req.json().catch(() => ({}));
    const requestedExtension = typeof body?.extension === "string"
      ? body.extension.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "jpg";
    const extension = allowedExtensions.has(requestedExtension) ? requestedExtension : "jpg";
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.storage
      .from("registration-photos")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      console.error("Unable to create registration photo upload link", error);
      return json({ error: "The photo service is temporarily unavailable. Please try again." }, 500);
    }

    return json({ path, token: data.token });
  } catch (error) {
    console.error("create-registration-photo-upload failed", error);
    return json({ error: "The photo service is temporarily unavailable. Please try again." }, 500);
  }
});
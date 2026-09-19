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

const allowedExtensions = new Set([
  // images
  "jpg", "jpeg", "png", "heic", "heif", "webp", "gif", "bmp",
  // videos
  "mp4", "mov", "webm", "m4v", "avi",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v", "avi"]);

// Homework proof videos are the only files allowed to be large.
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

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
    if (authError || !user) return json({ error: "Please sign in again before uploading." }, 401);

    const body = await req.json().catch(() => ({}));
    const requestedExtension = typeof body?.extension === "string"
      ? body.extension.toLowerCase().replace(/[^a-z0-9]/g, "")
      : "jpg";
    const kind = body?.kind === "drill" ? "drill" : "proof";

    let path: string;
    if (kind === "drill") {
      // Only coaches and admins may attach drill media to a task.
      const admin = createClient(supabaseUrl, serviceRoleKey);
      const { data: roles, error: rolesError } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "coach"]);
      if (rolesError || !roles?.length) {
        return json({ error: "Only coaches can upload drill media." }, 403);
      }
      const extension = allowedExtensions.has(requestedExtension) ? requestedExtension : "jpg";
      path = `drill/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    } else {
      const extension = allowedExtensions.has(requestedExtension) ? requestedExtension : "jpg";
      const isVideo = VIDEO_EXTENSIONS.has(extension);
      if (isVideo && typeof body?.sizeBytes === "number" && body.sizeBytes > MAX_VIDEO_BYTES) {
        return json({ error: "Videos need to be under 60MB. Try a shorter clip." }, 413);
      }
      path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.storage
      .from("homework-proof")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      console.error("Unable to create homework upload link", error);
      return json({ error: "The upload service is temporarily unavailable. Please try again." }, 500);
    }

    return json({ path, token: data.token });
  } catch (error) {
    console.error("create-homework-upload failed", error);
    return json({ error: "The upload service is temporarily unavailable. Please try again." }, 500);
  }
});

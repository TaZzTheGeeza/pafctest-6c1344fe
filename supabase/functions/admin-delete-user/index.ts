// Admin-only: permanently delete a user account (auth user + linked app data)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" });

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin only" });

    const body = await req.json().catch(() => ({}));
    const targetUserId = typeof body?.target_user_id === "string" ? body.target_user_id : "";
    const confirmEmail = typeof body?.confirm_email === "string" ? body.confirm_email.trim().toLowerCase() : "";
    if (!targetUserId) return json({ error: "target_user_id is required" });
    if (targetUserId === user.id) return json({ error: "You can't delete your own account here" });

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(targetUserId);
    if (getErr || !target?.user) return json({ error: "User not found" });

    const targetEmail = (target.user.email ?? "").trim().toLowerCase();
    if (targetEmail && confirmEmail && confirmEmail !== targetEmail) {
      return json({ error: "Confirmation email does not match this user" });
    }

    // Clear app-side rows that don't cascade from auth.users
    const cleanup: { table: string; column: string }[] = [
      { table: "user_roles", column: "user_id" },
      { table: "team_members", column: "user_id" },
      { table: "coach_age_groups", column: "user_id" },
      { table: "document_upload_permissions", column: "user_id" },
      { table: "push_subscriptions", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "profiles", column: "id" },
    ];
    for (const c of cleanup) {
      await admin.from(c.table).delete().eq(c.column, targetUserId);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (delErr) return json({ error: delErr.message });

    return json({ success: true, deleted_email: target.user.email ?? null });
  } catch (e) {
    return json({ error: (e as Error).message });
  }
});

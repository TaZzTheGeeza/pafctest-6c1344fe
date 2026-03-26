import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all team members
    const { data: teamMembers } = await supabaseAdmin
      .from("team_members")
      .select("user_id, team_slug");

    if (!teamMembers?.length) {
      return new Response(JSON.stringify({ message: "No team members found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all existing availability records
    const { data: existingAvailability } = await supabaseAdmin
      .from("fixture_availability")
      .select("user_id, team_slug, fixture_date, opponent");

    const availSet = new Set(
      (existingAvailability || []).map((a) => `${a.user_id}::${a.team_slug}::${a.fixture_date}::${a.opponent}`)
    );

    // Get recent notifications to avoid duplicates (within last 24hrs)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentNotifs } = await supabaseAdmin
      .from("hub_notifications")
      .select("user_id, title")
      .eq("type", "reminder")
      .gte("created_at", oneDayAgo);

    const recentNotifSet = new Set(
      (recentNotifs || []).map((n) => `${n.user_id}::${n.title}`)
    );

    // For each team, scrape fixtures and check who hasn't responded
    const teamSlugs = [...new Set(teamMembers.map((tm) => tm.team_slug))];
    let notificationsSent = 0;

    for (const teamSlug of teamSlugs) {
      // We can't call the scrape function from here easily, so we check
      // fixture_availability records that exist (they contain fixture dates/opponents)
      // and find team members who haven't responded to any upcoming fixture
      const teamUsers = teamMembers.filter((tm) => tm.team_slug === teamSlug);

      // Get all fixture dates for this team from existing availability data
      const teamFixtures = (existingAvailability || [])
        .filter((a) => a.team_slug === teamSlug)
        .reduce((acc, a) => {
          const key = `${a.fixture_date}::${a.opponent}`;
          if (!acc.has(key)) acc.set(key, { date: a.fixture_date, opponent: a.opponent });
          return acc;
        }, new Map<string, { date: string; opponent: string }>());

      for (const [, fixture] of teamFixtures) {
        for (const member of teamUsers) {
          const key = `${member.user_id}::${teamSlug}::${fixture.date}::${fixture.opponent}`;
          if (!availSet.has(key)) {
            // This user hasn't responded
            const notifKey = `${member.user_id}::Availability reminder: ${fixture.opponent}`;
            if (!recentNotifSet.has(notifKey)) {
              await supabaseAdmin.from("hub_notifications").insert({
                user_id: member.user_id,
                title: `Availability reminder: ${fixture.opponent}`,
                message: `Please confirm your availability for the match against ${fixture.opponent} on ${fixture.date}.`,
                type: "reminder",
                team_slug: teamSlug,
                link: `/hub?tab=availability&team=${teamSlug}`,
              });
              notificationsSent++;
            }
          }
        }
      }
    }

    // Payment reminders: check overdue payment requests
    const { data: activeRequests } = await supabaseAdmin
      .from("hub_payment_requests")
      .select("id, title, team_slug, due_date")
      .eq("status", "active")
      .not("due_date", "is", null);

    let paymentReminders = 0;
    if (activeRequests) {
      const now = new Date();
      for (const req of activeRequests) {
        if (!req.due_date || !req.team_slug) continue;
        const dueDate = new Date(req.due_date);
        const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        // Remind if due within 3 days or overdue
        if (daysUntilDue <= 3) {
          const teamUsers = teamMembers.filter((tm) => tm.team_slug === req.team_slug);
          
          // Check who has paid
          const { data: payments } = await supabaseAdmin
            .from("hub_payments")
            .select("user_id")
            .eq("request_id", req.id)
            .eq("status", "paid");

          const paidUsers = new Set((payments || []).map((p) => p.user_id));

          for (const member of teamUsers) {
            if (paidUsers.has(member.user_id)) continue;
            const notifKey = `${member.user_id}::Payment reminder: ${req.title}`;
            if (!recentNotifSet.has(notifKey)) {
              await supabaseAdmin.from("hub_notifications").insert({
                user_id: member.user_id,
                title: `Payment reminder: ${req.title}`,
                message: daysUntilDue < 0
                  ? `Your payment for "${req.title}" is overdue. Please pay as soon as possible.`
                  : `Your payment for "${req.title}" is due in ${Math.ceil(daysUntilDue)} day${Math.ceil(daysUntilDue) !== 1 ? "s" : ""}.`,
                type: "reminder",
                team_slug: req.team_slug,
                link: `/hub?tab=payments&team=${req.team_slug}`,
              });
              paymentReminders++;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        availabilityReminders: notificationsSent,
        paymentReminders,
        message: "Reminders processed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reminder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

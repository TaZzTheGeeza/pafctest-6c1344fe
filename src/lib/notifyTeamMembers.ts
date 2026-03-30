import { supabase } from "@/integrations/supabase/client";

/**
 * Sends an in-app notification + email to all members of a team.
 * This is a fire-and-forget helper — errors are logged but don't block the caller.
 */
export async function notifyTeamMembers({
  teamSlug,
  excludeUserId,
  notification,
  email,
}: {
  teamSlug: string;
  excludeUserId?: string;
  notification: {
    title: string;
    message: string;
    type: string;
    link?: string;
  };
  email?: {
    templateName: string;
    templateData: Record<string, any>;
    idempotencyPrefix: string;
  };
}) {
  try {
    // Get all team members
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_slug", teamSlug);

    if (!members?.length) return;

    const targetMembers = excludeUserId
      ? members.filter((m) => m.user_id !== excludeUserId)
      : members;

    if (targetMembers.length === 0) return;

    // Insert in-app notifications
    const notifications = targetMembers.map((m) => ({
      user_id: m.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      team_slug: teamSlug,
      link: notification.link || null,
    }));

    await supabase.from("hub_notifications").insert(notifications);

    // Send email notifications (one per member)
    if (email) {
      // Get emails for all target members
      const userIds = targetMembers.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profiles) {
        for (const profile of profiles) {
          if (!profile.email) continue;
          // Fire-and-forget — don't await each one
          supabase.functions
            .invoke("send-transactional-email", {
              body: {
                templateName: email.templateName,
                recipientEmail: profile.email,
                idempotencyKey: `${email.idempotencyPrefix}-${profile.id}`,
                templateData: email.templateData,
              },
            })
            .catch((err) => console.error("Email notification failed:", err));
        }
      }
    }
  } catch (err) {
    console.error("notifyTeamMembers error:", err);
  }
}

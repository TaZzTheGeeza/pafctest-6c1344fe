import { supabase } from "@/integrations/supabase/client";

const PUBLIC_SITE_URL = "https://www.pa-fc.uk";

function absoluteNotificationUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Sends in-app notification + email + push to all members of a team.
 * Fire-and-forget — errors are logged but don't block the caller.
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
    const destination = notification.link || `/hub?tab=notifications&team=${encodeURIComponent(teamSlug)}`;
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

    // 1. Insert in-app notifications
    const notifications = targetMembers.map((m) => ({
      user_id: m.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      team_slug: teamSlug,
      link: destination,
    }));

    await supabase.from("hub_notifications").insert(notifications);

    // 2. Send email notifications (one per member)
    if (email) {
      const userIds = targetMembers.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profiles) {
        for (const profile of profiles) {
          if (!profile.email) continue;
          supabase.functions
            .invoke("send-app-email", {
              body: {
                templateName: email.templateName,
                recipientEmail: profile.email,
                idempotencyKey: `${email.idempotencyPrefix}-${profile.id}`,
                templateData: {
                  ...email.templateData,
                  actionUrl: absoluteNotificationUrl(destination),
                },
              },
            })
            .catch((err) => console.error("Email notification failed:", err));
        }
      }
    }

    // 3. Send push notifications
    const pushUserIds = targetMembers.map((m) => m.user_id);
    supabase.functions
      .invoke("send-push-notification", {
        body: {
          userIds: pushUserIds,
          title: notification.title,
          message: notification.message,
          link: destination,
          tag: `${notification.type}-${teamSlug}`,
        },
      })
      .catch((err) => console.error("Push notification failed:", err));
  } catch (err) {
    console.error("notifyTeamMembers error:", err);
  }
}

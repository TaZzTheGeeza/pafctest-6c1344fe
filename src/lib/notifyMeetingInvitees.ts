import { supabase } from "@/integrations/supabase/client";

const PUBLIC_SITE_URL = "https://www.pa-fc.uk";

/**
 * Sends in-app + email + push notifications to meeting invitees.
 * For "everyone" meetings, notifies all users with profiles.
 */
export async function notifyMeetingInvitees({
  meetingId,
  inviteType,
  userIds,
  meeting,
}: {
  meetingId: string;
  inviteType: "everyone" | "roles" | "specific";
  userIds: string[]; // resolved user IDs (empty for "everyone")
  meeting: {
    title: string;
    scheduledDate: string;
    scheduledTime: string;
    duration: string;
    description?: string;
  };
}) {
  try {
    const destination = `/meetings?meeting=${encodeURIComponent(meetingId)}`;
    let targetUserIds = userIds;

    // For "everyone", get all profiles
    if (inviteType === "everyone") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      targetUserIds = (profiles ?? []).map((p) => p.id);
    }

    if (targetUserIds.length === 0) return;

    // 1. In-app notifications
    const notifications = targetUserIds.map((uid) => ({
      user_id: uid,
      title: "Meeting Invitation",
      message: `You're invited to: ${meeting.title} on ${meeting.scheduledDate} at ${meeting.scheduledTime}`,
      type: "meeting",
      link: destination,
    }));

    await supabase.from("hub_notifications").insert(notifications);

    // 2. Email notifications
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", targetUserIds);

    if (profiles) {
      for (const profile of profiles) {
        if (!profile.email) continue;
        supabase.functions
          .invoke("send-app-email", {
            body: {
              templateName: "meeting-invite",
              recipientEmail: profile.email,
              idempotencyKey: `meeting-invite-${meetingId}-${profile.id}`,
              templateData: {
                meetingTitle: meeting.title,
                scheduledDate: meeting.scheduledDate,
                scheduledTime: meeting.scheduledTime,
                duration: meeting.duration,
                description: meeting.description,
                actionUrl: `${PUBLIC_SITE_URL}${destination}`,
              },
            },
          })
          .catch((err) => console.error("Meeting email failed:", err));
      }
    }

    // 3. Push notifications
    supabase.functions
      .invoke("send-push-notification", {
        body: {
          userIds: targetUserIds,
          title: "Meeting Invitation",
          message: `You're invited to: ${meeting.title} on ${meeting.scheduledDate} at ${meeting.scheduledTime}`,
          link: destination,
          tag: `meeting-${meetingId}`,
        },
      })
      .catch((err) => console.error("Meeting push failed:", err));
  } catch (err) {
    console.error("notifyMeetingInvitees error:", err);
  }
}

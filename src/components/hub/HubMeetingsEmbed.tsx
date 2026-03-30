import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MeetingCard, type Meeting } from "@/components/meetings/MeetingCard";
import { Video, Loader2 } from "lucide-react";

export function HubMeetingsEmbed() {
  const { user, isAdmin } = useAuth();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["hub-meetings", isAdmin, user?.id],
    queryFn: async () => {
      if (isAdmin) {
        const { data, error } = await supabase
          .from("club_meetings")
          .select("*")
          .order("scheduled_at", { ascending: true });
        if (error) throw error;
        return data as Meeting[];
      }
      const { data: invitedMeetingIds } = await supabase
        .from("meeting_invitees")
        .select("meeting_id")
        .eq("user_id", user!.id);
      const invitedIds = invitedMeetingIds?.map((i) => i.meeting_id) || [];

      const { data, error } = await supabase
        .from("club_meetings")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;

      return (data as Meeting[]).filter(
        (m) => m.invite_type === "everyone" || invitedIds.includes(m.id)
      );
    },
  });

  const upcomingMeetings = meetings.filter(
    (m) => m.status !== "ended" && new Date(m.scheduled_at) >= new Date(Date.now() - 2 * 60 * 60 * 1000)
  );

  const handleJoin = (meeting: Meeting) => {
    window.open(`/meetings`, "_self");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading meetings...
      </div>
    );
  }

  if (upcomingMeetings.length === 0) {
    return (
      <div className="text-center py-16">
        <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display font-bold text-foreground mb-2">No Upcoming Meetings</h3>
        <p className="text-sm text-muted-foreground">You'll see meetings here when you're invited to one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-foreground">Upcoming Meetings</h2>
      <div className="grid gap-4">
        {upcomingMeetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            isAdmin={false}
            inviteeCount={0}
            onJoin={() => handleJoin(meeting)}
          />
        ))}
      </div>
    </div>
  );
}

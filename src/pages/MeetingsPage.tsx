import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifyMeetingInvitees } from "@/lib/notifyMeetingInvitees";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, ArrowLeft, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { MeetingCard, type Meeting } from "@/components/meetings/MeetingCard";
import { MeetingInviteSelector, type InviteType } from "@/components/meetings/MeetingInviteSelector";

export default function MeetingsPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Meeting | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("19:00");
  const [duration, setDuration] = useState(60);

  // Invite state
  const [inviteType, setInviteType] = useState<InviteType>("everyone");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["club-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_meetings")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data as Meeting[];
    },
  });

  // Fetch invitee counts per meeting
  const { data: inviteeCounts = {} } = useQuery({
    queryKey: ["meeting-invitee-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("meeting_invitees")
        .select("meeting_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row: any) => {
        counts[row.meeting_id] = (counts[row.meeting_id] || 0) + 1;
      });
      return counts;
    },
  });

  const upcomingMeetings = meetings.filter(
    (m) => m.status !== "ended" && new Date(m.scheduled_at) >= new Date(Date.now() - 2 * 60 * 60 * 1000)
  );
  const pastMeetings = meetings.filter(
    (m) => m.status === "ended" || new Date(m.scheduled_at) < new Date(Date.now() - 2 * 60 * 60 * 1000)
  );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setScheduledDate("");
    setScheduledTime("19:00");
    setDuration(60);
    setInviteType("everyone");
    setSelectedRoles([]);
    setSelectedUsers([]);
    setShowCreate(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledDate || !user) return;

    // Validate invite selections
    if (inviteType === "roles" && selectedRoles.length === 0) {
      toast.error("Please select at least one role to invite");
      return;
    }
    if (inviteType === "specific" && selectedUsers.length === 0) {
      toast.error("Please select at least one person to invite");
      return;
    }

    setSaving(true);
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    // Create the meeting
    const { data: newMeeting, error } = await supabase
      .from("club_meetings")
      .insert({
        title,
        description: description || null,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        created_by: user.id,
        invite_type: inviteType,
      } as any)
      .select()
      .single();

    if (error || !newMeeting) {
      setSaving(false);
      toast.error("Failed to create meeting");
      console.error(error);
      return;
    }

    // Insert invitees
    let userIdsToInvite: string[] = [];

    if (inviteType === "roles") {
      // Resolve roles to user IDs
      const { data: roleUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", selectedRoles);
      const uniqueIds = new Set((roleUsers ?? []).map((r: any) => r.user_id));
      userIdsToInvite = Array.from(uniqueIds);
    } else if (inviteType === "specific") {
      userIdsToInvite = selectedUsers;
    }

    if (userIdsToInvite.length > 0) {
      const invitees = userIdsToInvite.map((uid) => ({
        meeting_id: (newMeeting as any).id,
        user_id: uid,
      }));
      await supabase.from("meeting_invitees").insert(invitees as any);
    }

    // Send notifications (fire-and-forget)
    const formattedDate = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const durationLabel = duration <= 60 ? `${duration} minutes` : `${duration / 60} hours`;
    notifyMeetingInvitees({
      meetingId: (newMeeting as any).id,
      inviteType,
      userIds: userIdsToInvite,
      meeting: {
        title,
        scheduledDate: formattedDate,
        scheduledTime,
        duration: durationLabel,
        description: description || undefined,
      },
    });

    setSaving(false);
    toast.success("Meeting scheduled!");
    queryClient.invalidateQueries({ queryKey: ["club-meetings"] });
    queryClient.invalidateQueries({ queryKey: ["meeting-invitee-counts"] });
    resetForm();
  };

  const handleStartMeeting = async (meeting: Meeting) => {
    if (isAdmin && meeting.status === "scheduled") {
      await supabase
        .from("club_meetings")
        .update({ status: "live" } as any)
        .eq("id", meeting.id);
      queryClient.invalidateQueries({ queryKey: ["club-meetings"] });
    }
    setActiveRoom(meeting);
  };

  const handleEndMeeting = async (meeting: Meeting) => {
    await supabase
      .from("club_meetings")
      .update({ status: "ended" } as any)
      .eq("id", meeting.id);
    queryClient.invalidateQueries({ queryKey: ["club-meetings"] });
    setActiveRoom(null);
    toast.success("Meeting ended");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("club_meetings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Meeting deleted");
    queryClient.invalidateQueries({ queryKey: ["club-meetings"] });
    queryClient.invalidateQueries({ queryKey: ["meeting-invitee-counts"] });
  };

  // Active video room
  if (activeRoom) {
    const roomName = `pafc-${activeRoom.room_code}`;
    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-card/90 border-b border-border backdrop-blur-sm">
          <button
            onClick={() => setActiveRoom(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Leave Meeting
          </button>
          <h2 className="text-sm font-display font-bold text-foreground tracking-wider uppercase">
            {activeRoom.title}
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin && activeRoom.status !== "ended" && (
              <button
                onClick={() => handleEndMeeting(activeRoom)}
                className="px-3 py-1.5 rounded-lg text-xs font-display tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                End Meeting
              </button>
            )}
          </div>
        </div>
        <div className="flex-1">
          <iframe
            src={`https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinConfig.enabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.DEFAULT_BACKGROUND='#1a1a2e'`}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            className="w-full h-full border-0"
            title="Club Meeting"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground tracking-wider uppercase">
                Club Meetings
              </h1>
              <p className="text-sm text-muted-foreground">
                Video calls for committee meetings, team briefings & AGMs
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Meeting
            </button>
          )}
        </div>

        {/* Create Meeting Dialog */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10 rounded-t-xl">
                <h3 className="font-display text-sm font-bold text-foreground tracking-wider uppercase">
                  Schedule Meeting
                </h3>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Committee Meeting"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Agenda items, notes..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display text-muted-foreground mb-1 tracking-wider uppercase">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                {/* Invite Selector */}
                <MeetingInviteSelector
                  inviteType={inviteType}
                  setInviteType={setInviteType}
                  selectedRoles={selectedRoles}
                  setSelectedRoles={setSelectedRoles}
                  selectedUsers={selectedUsers}
                  setSelectedUsers={setSelectedUsers}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg text-xs font-display tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !title || !scheduledDate}
                    className="px-4 py-2 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Scheduling…" : "Schedule Meeting"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Upcoming Meetings */}
        {!isLoading && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-display font-bold text-foreground tracking-wider uppercase mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Upcoming & Live
              </h2>

              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-12 bg-card/50 border border-border rounded-xl">
                  <Video className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No upcoming meetings scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      isAdmin={isAdmin}
                      inviteeCount={inviteeCounts[meeting.id]}
                      onJoin={() => handleStartMeeting(meeting)}
                      onDelete={() => handleDelete(meeting.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Past Meetings */}
            {pastMeetings.length > 0 && (
              <div>
                <h2 className="text-sm font-display font-bold text-muted-foreground tracking-wider uppercase mb-3">
                  Past Meetings
                </h2>
                <div className="space-y-2 opacity-60">
                  {pastMeetings.slice(0, 10).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-3 bg-card/30 border border-border/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meeting.scheduled_at), "dd MMM yyyy · HH:mm")}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">Ended</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

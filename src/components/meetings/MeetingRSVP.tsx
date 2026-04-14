import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, HelpCircle, Users, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RSVPSummary {
  attending: number;
  not_attending: number;
  maybe: number;
  total: number;
  responses: { user_id: string; status: string; full_name: string | null }[];
}

const statusConfig = {
  attending: { icon: Check, label: "Attending", class: "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30" },
  not_attending: { icon: X, label: "Can't Make It", class: "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30" },
  maybe: { icon: HelpCircle, label: "Maybe", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30" },
} as const;

export function MeetingRSVP({ meetingId, meetingTitle }: { meetingId: string; meetingTitle: string }) {
  const { user, isAdmin } = useAuth();
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<RSVPSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRSVPs();
  }, [meetingId, user]);

  const fetchRSVPs = async () => {
    const { data: rsvps } = await supabase
      .from("meeting_rsvps" as any)
      .select("user_id, status")
      .eq("meeting_id", meetingId);

    if (rsvps) {
      const userIds = (rsvps as any[]).map((r: any) => r.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      const attending = (rsvps as any[]).filter((r: any) => r.status === "attending").length;
      const not_attending = (rsvps as any[]).filter((r: any) => r.status === "not_attending").length;
      const maybe = (rsvps as any[]).filter((r: any) => r.status === "maybe").length;

      setSummary({
        attending,
        not_attending,
        maybe,
        total: (rsvps as any[]).length,
        responses: (rsvps as any[]).map((r: any) => ({
          user_id: r.user_id,
          status: r.status,
          full_name: profileMap.get(r.user_id) || "Member",
        })),
      });

      if (user) {
        const mine = (rsvps as any[]).find((r: any) => r.user_id === user.id);
        setMyStatus(mine?.status || null);
      }
    }
  };

  const handleRSVP = async (status: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("meeting_rsvps" as any)
        .upsert(
          { meeting_id: meetingId, user_id: user.id, status, updated_at: new Date().toISOString() } as any,
          { onConflict: "meeting_id,user_id" }
        );
      if (error) throw error;
      setMyStatus(status);
      toast.success(`Marked as ${statusConfig[status as keyof typeof statusConfig]?.label || status}`);
      fetchRSVPs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!isAdmin) return;
    setSendingReminder(true);
    try {
      // Get all invitees for this meeting
      const { data: invitees } = await supabase
        .from("meeting_invitees")
        .select("user_id")
        .eq("meeting_id", meetingId);

      // Get who already responded
      const { data: rsvps } = await supabase
        .from("meeting_rsvps" as any)
        .select("user_id")
        .eq("meeting_id", meetingId);

      const respondedIds = new Set((rsvps as any[] || []).map((r: any) => r.user_id));

      // If invite_type is "everyone", get all users from profiles who haven't responded
      let nonResponders: string[] = [];

      if (invitees && invitees.length > 0) {
        nonResponders = invitees
          .map((i) => i.user_id)
          .filter((uid) => !respondedIds.has(uid));
      } else {
        // "everyone" meeting — get all profiles
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id");
        nonResponders = (allProfiles || [])
          .map((p) => p.id)
          .filter((uid) => !respondedIds.has(uid));
      }

      if (nonResponders.length === 0) {
        toast.info("Everyone has already responded!");
        setSendingReminder(false);
        return;
      }

      // Send in-app notifications
      const notifications = nonResponders.map((uid) => ({
        user_id: uid,
        title: `Meeting RSVP reminder: ${meetingTitle}`,
        message: `Please confirm your attendance for "${meetingTitle}".`,
        type: "reminder",
        link: "/meetings",
      }));

      const { error } = await supabase.from("hub_notifications").insert(notifications);
      if (error) throw error;

      // Send push notifications
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: {
            userIds: nonResponders,
            title: `Meeting RSVP Reminder`,
            body: `Please confirm your attendance for "${meetingTitle}".`,
            url: "/meetings",
          },
        });
      } catch {}

      toast.success(`Reminder sent to ${nonResponders.length} member${nonResponders.length !== 1 ? "s" : ""}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reminders");
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {/* RSVP Buttons */}
      {user && (
        <div className="flex gap-1.5">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isActive = myStatus === status;
            return (
              <button
                key={status}
                onClick={() => handleRSVP(status)}
                disabled={loading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-display tracking-wider transition-all",
                  isActive
                    ? config.class + " ring-1 ring-offset-1 ring-offset-background"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {summary && summary.total > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center gap-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-green-400">{summary.attending} ✓</span>
            <span className="text-red-400">{summary.not_attending} ✗</span>
            <span className="text-yellow-400">{summary.maybe} ?</span>
          </div>
          <span className="ml-auto text-[10px]">{showDetails ? "Hide" : "Details"}</span>
        </button>
      )}

      {/* Detail breakdown */}
      {showDetails && summary && isAdmin && (
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
          {(["attending", "not_attending", "maybe"] as const).map((status) => {
            const people = summary.responses.filter((r) => r.status === status);
            if (people.length === 0) return null;
            const config = statusConfig[status];
            return (
              <div key={status}>
                <p className="text-[10px] font-display tracking-wider text-muted-foreground uppercase mb-1">
                  {config.label} ({people.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {people.map((p) => (
                    <span
                      key={p.user_id}
                      className={cn("text-[10px] px-2 py-0.5 rounded-full border", config.class)}
                    >
                      {p.full_name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

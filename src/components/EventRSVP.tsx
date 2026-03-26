import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, HelpCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RSVPSummary {
  available: number;
  unavailable: number;
  maybe: number;
  total: number;
  responses: { user_id: string; status: string; full_name: string | null }[];
}

const statusConfig = {
  available: { icon: Check, label: "Available", class: "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30" },
  unavailable: { icon: X, label: "Can't Make It", class: "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30" },
  maybe: { icon: HelpCircle, label: "Maybe", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30" },
} as const;

export function EventRSVP({ eventId }: { eventId: string }) {
  const { user, isCoach, isAdmin } = useAuth();
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<RSVPSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRSVPs();
  }, [eventId, user]);

  const fetchRSVPs = async () => {
    // Fetch all RSVPs for this event with profile names
    const { data: rsvps } = await supabase
      .from("event_rsvps")
      .select("user_id, status")
      .eq("event_id", eventId);

    if (rsvps) {
      // Get profile names for all respondents
      const userIds = rsvps.map(r => r.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      const available = rsvps.filter(r => r.status === "available").length;
      const unavailable = rsvps.filter(r => r.status === "unavailable").length;
      const maybe = rsvps.filter(r => r.status === "maybe").length;

      setSummary({
        available,
        unavailable,
        maybe,
        total: rsvps.length,
        responses: rsvps.map(r => ({
          user_id: r.user_id,
          status: r.status,
          full_name: profileMap.get(r.user_id) || "Member",
        })),
      });

      if (user) {
        const mine = rsvps.find(r => r.user_id === user.id);
        setMyStatus(mine?.status || null);
      }
    }
  };

  const handleRSVP = async (status: string) => {
    if (!user) {
      toast.error("Please sign in to RSVP");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("event_rsvps")
        .upsert(
          { event_id: eventId, user_id: user.id, status, updated_at: new Date().toISOString() },
          { onConflict: "event_id,user_id" }
        );

      if (error) throw error;
      setMyStatus(status);
      toast.success(`Marked as ${statusConfig[status as keyof typeof statusConfig]?.label || status}`);
      fetchRSVPs();
    } catch (err: any) {
      toast.error(err.message || "Failed to update RSVP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
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
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Summary Bar */}
      {summary && summary.total > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center gap-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users className="h-3.5 w-3.5 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-green-400">{summary.available} ✓</span>
            <span className="text-red-400">{summary.unavailable} ✗</span>
            <span className="text-yellow-400">{summary.maybe} ?</span>
          </div>
          <span className="ml-auto text-[10px]">{showDetails ? "Hide" : "Details"}</span>
        </button>
      )}

      {/* Detailed Breakdown (coaches/admins or expanded) */}
      {showDetails && summary && (isCoach || isAdmin) && (
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
          {(["available", "unavailable", "maybe"] as const).map((status) => {
            const people = summary.responses.filter(r => r.status === status);
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

      {!user && (
        <p className="text-[10px] text-muted-foreground italic">Sign in to RSVP for this event</p>
      )}
    </div>
  );
}

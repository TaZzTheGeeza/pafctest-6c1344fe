import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, Bell, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface Recipient {
  user_id: string;
  full_name: string;
  email: string | null;
  hasResponded: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  teamSlug: string;
  fixtureDate: string; // DD/MM/YY
  opponent: string;
  itemTitle: string;
  itemTime: string;
  itemVenue: string;
  friendlyDate: string;
}

export function ReminderPreviewDialog({
  open,
  onClose,
  teamSlug,
  fixtureDate,
  opponent,
  itemTitle,
  itemTime,
  itemVenue,
  friendlyDate,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_slug", teamSlug);

        if (!members?.length) {
          if (!cancelled) {
            setRecipients([]);
            setLoading(false);
          }
          return;
        }

        const { data: responded } = await supabase
          .from("fixture_availability")
          .select("user_id")
          .eq("team_slug", teamSlug)
          .eq("fixture_date", fixtureDate)
          .eq("opponent", opponent);

        const respondedIds = new Set((responded || []).map((r) => r.user_id));
        const allMemberIds = members.map((m) => m.user_id);

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", allMemberIds);

        const list: Recipient[] = allMemberIds.map((id) => {
          const p = profiles?.find((pr) => pr.id === id);
          return {
            user_id: id,
            full_name: p?.full_name || "Unknown member",
            email: p?.email || null,
            hasResponded: respondedIds.has(id),
          };
        }).sort((a, b) => a.full_name.localeCompare(b.full_name));

        if (!cancelled) {
          setRecipients(list);
          // Default selection: only non-responders
          setSelected(new Set(list.filter((r) => !r.hasResponded).map((r) => r.user_id)));
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load reminder preview:", err);
        if (!cancelled) {
          toast.error("Failed to load recipients");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, teamSlug, fixtureDate, opponent]);

  const visibleRecipients = showAll ? recipients : recipients.filter((r) => !r.hasResponded);
  const nonResponderCount = recipients.filter((r) => !r.hasResponded).length;

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    const visibleIds = visibleRecipients.map((r) => r.user_id);
    const allVisibleSelected = visibleIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSend = async () => {
    const chosen = recipients.filter((r) => selected.has(r.user_id));
    if (chosen.length === 0) {
      toast.info("Select at least one person to remind");
      return;
    }

    setSending(true);
    try {
      const userIds = chosen.map((r) => r.user_id);

      // 1. In-app notifications
      const notifications = userIds.map((uid) => ({
        user_id: uid,
        title: "Availability Reminder",
        message: `${itemTitle} — ${friendlyDate}. Please submit your availability.`,
        type: "event",
        team_slug: teamSlug,
        link: "/hub?tab=availability",
      }));
      await supabase.from("hub_notifications").insert(notifications);

      // 2. Emails
      for (const r of chosen) {
        if (!r.email) continue;
        supabase.functions
          .invoke("send-transactional-email", {
            body: {
              templateName: "availability-event-added",
              recipientEmail: r.email,
              idempotencyKey: `avail-resend-${teamSlug}-${fixtureDate}-${Date.now()}-${r.user_id}`,
              templateData: {
                eventTitle: itemTitle,
                eventDate: friendlyDate,
                eventTime: itemTime,
                venue: itemVenue || undefined,
                teamName: teamSlug,
              },
            },
          })
          .catch((err) => console.error("Email notification failed:", err));
      }

      // 3. Push
      supabase.functions
        .invoke("send-push-notification", {
          body: {
            userIds,
            title: "Availability Reminder",
            message: `${itemTitle} — ${friendlyDate}. Please submit your availability.`,
            link: "/hub?tab=availability",
            tag: `event-${teamSlug}`,
          },
        })
        .catch((err) => console.error("Push notification failed:", err));

      toast.success(`Reminder sent to ${chosen.length} member${chosen.length !== 1 ? "s" : ""}`);
      onClose();
    } catch (err) {
      console.error("Send reminder failed:", err);
      toast.error("Failed to send reminders");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground tracking-wider uppercase flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Send Availability Reminder
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {itemTitle} · {friendlyDate}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading recipients…
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-foreground font-display">Everyone has already responded! 🎉</p>
              <p className="text-xs text-muted-foreground mt-2">No reminders needed.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  {selected.size} of {recipients.length} selected
                </p>
                <button
                  onClick={toggleAll}
                  className="text-xs text-primary hover:text-primary/80 font-display tracking-wider uppercase"
                >
                  {selected.size === recipients.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              <ul className="space-y-1.5">
                {recipients.map((r) => {
                  const isChecked = selected.has(r.user_id);
                  return (
                    <li key={r.user_id}>
                      <label
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-primary/5 border-primary/40"
                            : "border-border hover:bg-secondary/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(r.user_id)}
                          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-display truncate">{r.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.email || <span className="italic">No email on file</span>}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 p-3 rounded-lg bg-secondary/40 border border-border">
                <p className="text-[10px] font-display tracking-wider text-muted-foreground uppercase mb-2">
                  Will send via
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-foreground">
                  <span className="flex items-center gap-1.5"><Bell className="h-3 w-3 text-primary" /> In-app</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-primary" /> Email</span>
                  <span className="flex items-center gap-1.5"><Smartphone className="h-3 w-3 text-primary" /> Push</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 rounded-lg text-xs font-display tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          {recipients.length > 0 && (
            <button
              onClick={handleSend}
              disabled={sending || selected.size === 0}
              className="px-4 py-2 rounded-lg text-xs font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : `Send to ${selected.size}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Mail, Smartphone, Send, Loader2, Users, Megaphone, User } from "lucide-react";

const TEAM_SLUGS = [
  "u7s", "u8s-black", "u8s-gold", "u9s", "u10s",
  "u11s-black", "u11s-gold", "u13s-black", "u13s-gold", "u14s",
];

const TEAM_LABELS: Record<string, string> = {
  "u7s": "U7",
  "u8s-black": "U8 Black",
  "u8s-gold": "U8 Gold",
  "u9s": "U9",
  "u10s": "U10",
  "u11s-black": "U11 Black",
  "u11s-gold": "U11 Gold",
  "u13s-black": "U13 Black",
  "u13s-gold": "U13 Gold",
  "u14s": "U14",
};

export function AdminNotificationComposer() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "team" | "member">("all");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [sendInApp, setSendInApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendPush, setSendPush] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("hub_notifications")
      .select("*")
      .eq("type", "admin_broadcast")
      .order("created_at", { ascending: false })
      .limit(20);
    // Deduplicate by title+created_at (broadcasts create one row per user)
    const seen = new Set<string>();
    const unique = (data ?? []).filter((n) => {
      const key = `${n.title}|${n.message}|${n.created_at.slice(0, 16)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setHistory(unique);
    setLoadingHistory(false);
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!sendInApp && !sendEmail && !sendPush) {
      toast.error("Select at least one delivery channel");
      return;
    }
    if (audience === "team" && !selectedTeam) {
      toast.error("Select a team");
      return;
    }
    if (audience === "member" && !selectedMemberId) {
      toast.error("Select a member");
      return;
    }

    setSending(true);
    try {
      // Get target users
      let targetUserIds: string[] = [];

      if (audience === "member") {
        targetUserIds = [selectedMemberId];
      } else if (audience === "team") {
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_slug", selectedTeam);
        targetUserIds = (members ?? []).map((m) => m.user_id);
      } else {
        // All players: get all unique user_ids from team_members
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id");
        const unique = [...new Set((members ?? []).map((m) => m.user_id))];
        targetUserIds = unique;
      }

      // Exclude the sender
      targetUserIds = targetUserIds.filter((id) => id !== user?.id);

      if (targetUserIds.length === 0) {
        toast.error("No members to notify");
        setSending(false);
        return;
      }

      // 1. In-app notifications
      if (sendInApp) {
        const notifications = targetUserIds.map((uid) => ({
          user_id: uid,
          title: title.trim(),
          message: message.trim(),
          type: "admin_broadcast",
          team_slug: audience === "team" ? selectedTeam : null,
        }));
        const { error } = await supabase.from("hub_notifications").insert(notifications);
        if (error) console.error("In-app notification insert error:", error);
      }

      // 2. Email notifications
      if (sendEmail) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", targetUserIds);

        if (profiles) {
          for (const profile of profiles) {
            if (!profile.email) continue;
            supabase.functions
              .invoke("send-transactional-email", {
                body: {
                  templateName: "admin-broadcast",
                  recipientEmail: profile.email,
                  idempotencyKey: `admin-broadcast-${Date.now()}-${profile.id}`,
                  templateData: {
                    title: title.trim(),
                    message: message.trim(),
                  },
                },
              })
              .catch((err) => console.error("Email send failed:", err));
          }
        }
      }

      // 3. Push notifications
      if (sendPush) {
        supabase.functions
          .invoke("send-push-notification", {
            body: {
              userIds: targetUserIds,
              title: title.trim(),
              message: message.trim(),
              tag: `admin-broadcast-${Date.now()}`,
            },
          })
          .catch((err) => console.error("Push send failed:", err));
      }

      const channelList = [
        sendInApp && "in-app",
        sendEmail && "email",
        sendPush && "push",
      ].filter(Boolean).join(", ");

      toast.success(`Notification sent to ${targetUserIds.length} members via ${channelList}`);
      setTitle("");
      setMessage("");
      loadHistory();
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Send Notification</h2>
            <p className="text-xs text-muted-foreground">Compose and send a custom message to club members</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Audience
              </Label>
              <Select value={audience} onValueChange={(v) => { setAudience(v as "all" | "team" | "member"); setSelectedMemberId(""); setMemberSearch(""); setMemberResults([]); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" /> All Members
                    </span>
                  </SelectItem>
                  <SelectItem value="team">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" /> Specific Team
                    </span>
                  </SelectItem>
                  <SelectItem value="member">
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" /> Specific Member
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience === "team" && (
              <div>
                <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Team
                </Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_SLUGS.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {TEAM_LABELS[slug] || slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {audience === "member" && (
              <div className="relative">
                <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Member
                </Label>
                {selectedMemberId ? (
                  <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm flex-1 truncate">
                      {memberResults.find(m => m.id === selectedMemberId)?.full_name || memberResults.find(m => m.id === selectedMemberId)?.email || "Selected member"}
                    </span>
                    <button onClick={() => { setSelectedMemberId(""); setMemberSearch(""); }} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                  </div>
                ) : (
                  <>
                    <Input
                      value={memberSearch}
                      onChange={async (e) => {
                        const q = e.target.value;
                        setMemberSearch(q);
                        if (q.length < 2) { setMemberResults([]); return; }
                        const { data } = await supabase
                          .from("profiles")
                          .select("id, full_name, email")
                          .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
                          .limit(8);
                        setMemberResults(data ?? []);
                      }}
                      placeholder="Search by name or email..."
                    />
                    {memberResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        {memberResults.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedMemberId(m.id); setMemberSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors flex flex-col"
                          >
                            <span className="font-display text-foreground">{m.full_name || "No name"}</span>
                            <span className="text-[10px] text-muted-foreground">{m.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Training Cancelled This Saturday"
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div>
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Message
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/1000</p>
          </div>

          {/* Channels */}
          <div>
            <Label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2 block">
              Delivery Channels
            </Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={sendInApp} onCheckedChange={(c) => setSendInApp(!!c)} />
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">In-App</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(!!c)} />
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={sendPush} onCheckedChange={(c) => setSendPush(!!c)} />
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Push</span>
              </label>
            </div>
          </div>

          {/* Send */}
          <Button onClick={handleSend} disabled={sending} className="w-full sm:w-auto">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-display tracking-wider uppercase text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Recent Broadcasts
          </h3>
        </div>
        {loadingHistory ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No broadcasts sent yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(n.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
                {n.team_slug && (
                  <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {TEAM_LABELS[n.team_slug] || n.team_slug}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

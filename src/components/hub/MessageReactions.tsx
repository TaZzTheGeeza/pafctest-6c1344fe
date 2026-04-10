import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SmilePlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "⚽"];

interface ReactionGroup {
  emoji: string;
  count: number;
  userReacted: boolean;
  userIds: string[];
}

interface Props {
  messageId: string;
  isOwn: boolean;
}

export function MessageReactions({ messageId, isOwn }: Props) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionGroup[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [reactionProfiles, setReactionProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReactions();

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hub_message_reactions", filter: `message_id=eq.${messageId}` },
        () => loadReactions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [messageId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  async function loadReactions() {
    const { data } = await supabase
      .from("hub_message_reactions")
      .select("emoji, user_id")
      .eq("message_id", messageId);

    if (!data) return;

    const grouped: Record<string, { count: number; userReacted: boolean; userIds: string[] }> = {};
    for (const r of data) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, userReacted: false, userIds: [] };
      grouped[r.emoji].count++;
      grouped[r.emoji].userIds.push(r.user_id);
      if (r.user_id === user?.id) grouped[r.emoji].userReacted = true;
    }

    setReactions(
      Object.entries(grouped).map(([emoji, g]) => ({ emoji, ...g }))
    );

    // Fetch names for all reactors we don't know yet
    const allUserIds = [...new Set(data.map((r) => r.user_id))];
    const missing = allUserIds.filter((id) => !reactionProfiles[id]);
    if (missing.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", missing);
      if (profileData) {
        const next: Record<string, string> = {};
        for (const p of profileData as any[]) {
          next[p.id] = p.full_name?.trim() || p.email?.split("@")[0] || "Unknown";
        }
        setReactionProfiles((prev) => ({ ...prev, ...next }));
      }
    }
  }

  async function toggleReaction(emoji: string) {
    if (!user) return;
    setShowPicker(false);

    const existing = reactions.find((r) => r.emoji === emoji && r.userReacted);
    if (existing) {
      await supabase
        .from("hub_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("hub_message_reactions")
        .insert({ message_id: messageId, user_id: user.id, emoji });
    }
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>
      {reactions.map((r) => (
        <Tooltip key={r.emoji}>
          <TooltipTrigger asChild>
            <button
              onClick={() => toggleReaction(r.emoji)}
              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                r.userReacted
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/20"
              }`}
            >
              <span>{r.emoji}</span>
              <span className="font-display text-[10px]">{r.count}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-[11px] text-muted-foreground">
              {r.userIds
                .map((id) =>
                  id === user?.id ? "You" : reactionProfiles[id] || "..."
                )
                .join(", ")}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          title="Add reaction"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>

        {showPicker && (
          <div className={`absolute bottom-full mb-1 bg-card border border-border rounded-lg shadow-xl shadow-black/20 p-1.5 flex gap-1 z-50 ${isOwn ? "right-0" : "left-0"}`}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="text-base hover:scale-125 transition-transform p-1 rounded hover:bg-secondary"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

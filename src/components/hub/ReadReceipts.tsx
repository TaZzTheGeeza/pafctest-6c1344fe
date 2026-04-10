import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, CheckCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface ReadInfo {
  user_id: string;
  read_at: string;
}

interface ReaderProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Props {
  messageId: string;
  messageUserId: string;
  profiles: Record<string, string>;
}

export function ReadReceipts({ messageId, messageUserId, profiles }: Props) {
  const { user } = useAuth();
  const [readers, setReaders] = useState<ReadInfo[]>([]);
  const [readerProfiles, setReaderProfiles] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const isOwn = user?.id === messageUserId;

  useEffect(() => {
    if (!isOwn) return;
    loadReaders();

    const channel = supabase
      .channel(`reads-${messageId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hub_message_reads", filter: `message_id=eq.${messageId}` },
        () => loadReaders()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [messageId, isOwn]);

  async function loadReaders() {
    const { data } = await supabase
      .from("hub_message_reads")
      .select("user_id, read_at")
      .eq("message_id", messageId);

    if (data) {
      const filteredReaders = data.filter((r) => r.user_id !== messageUserId);
      setReaders(filteredReaders);

      const missingReaderIds = [...new Set(filteredReaders.map((reader) => reader.user_id))].filter(
        (readerId) => !profiles[readerId] && !readerProfiles[readerId]
      );

      if (missingReaderIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", missingReaderIds);

        if (profileData) {
          const nextProfiles = (profileData as ReaderProfileRow[]).reduce<Record<string, string>>((acc, profile) => {
            const fallbackName = profile.email?.split("@")[0]?.trim();
            acc[profile.id] = profile.full_name?.trim() || fallbackName || "Unknown";
            return acc;
          }, {});

          setReaderProfiles((prev) => ({ ...prev, ...nextProfiles }));
        }
      }
    }

    setLoaded(true);
  }

  if (!isOwn || !loaded) return null;

  const hasReaders = readers.length > 0;

  const [showReaders, setShowReaders] = useState(false);

  if (!hasReaders) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <Check className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground font-display">Sent</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => setShowReaders((prev) => !prev)}
        className="flex items-center gap-1 justify-end cursor-pointer hover:opacity-80 transition-opacity"
      >
        <CheckCheck className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] text-primary font-display font-medium">
          Read by {readers.length}
        </span>
      </button>
      {showReaders && (
        <div className="bg-popover border rounded-md px-2.5 py-1.5 shadow-md mt-0.5 max-w-[220px]">
          <p className="text-xs font-display font-bold mb-1">Read by</p>
          <div className="space-y-0.5">
            {readers.map((r) => (
              <p key={r.user_id} className="text-[11px] text-muted-foreground">
                {profiles[r.user_id] || readerProfiles[r.user_id] || "Unknown"} · {format(new Date(r.read_at), "HH:mm")}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

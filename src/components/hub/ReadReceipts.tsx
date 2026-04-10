import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface ReadInfo {
  user_id: string;
  read_at: string;
}

interface Props {
  messageId: string;
  messageUserId: string;
  profiles: Record<string, string>;
}

export function ReadReceipts({ messageId, messageUserId, profiles }: Props) {
  const { user } = useAuth();
  const [readers, setReaders] = useState<ReadInfo[]>([]);

  const isOwn = user?.id === messageUserId;

  useEffect(() => {
    if (!isOwn) return; // Only show read receipts on your own messages
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
      // Exclude the message author from the readers list
      setReaders(data.filter((r) => r.user_id !== messageUserId));
    }
  }

  if (!isOwn || readers.length === 0) return null;

  const readerNames = readers.map((r) => profiles[r.user_id] || "Unknown");
  const displayText = readerNames.length <= 3
    ? readerNames.join(", ")
    : `${readerNames.slice(0, 3).join(", ")} +${readerNames.length - 3}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 justify-end mt-0.5 cursor-default">
          <CheckCheck className="h-3 w-3 text-blue-400" />
          <span className="text-[9px] text-blue-400 font-display">
            Read by {readers.length}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px]">
        <p className="text-xs font-display font-bold mb-1">Read by</p>
        <div className="space-y-0.5">
          {readers.map((r) => (
            <p key={r.user_id} className="text-[11px] text-muted-foreground">
              {profiles[r.user_id] || "Unknown"} · {format(new Date(r.read_at), "HH:mm")}
            </p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

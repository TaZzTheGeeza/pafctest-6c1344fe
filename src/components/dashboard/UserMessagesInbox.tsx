import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Loader2, Clock, MessageSquare, ChevronDown, ChevronUp, Inbox } from "lucide-react";

interface EnquiryWithReplies {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  replies: any[];
}

export function UserMessagesInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<EnquiryWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadThreads();
  }, [user]);

  async function loadThreads() {
    setLoading(true);

    // Get the user's email from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user!.id)
      .single();

    if (!profile?.email) {
      setLoading(false);
      return;
    }

    // Get all contact submissions from this email
    const { data: submissions } = await supabase
      .from("contact_submissions")
      .select("*")
      .eq("email", profile.email)
      .order("created_at", { ascending: false });

    if (!submissions || submissions.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    // Get replies for all submissions
    const subIds = submissions.map((s) => s.id);
    const { data: allReplies } = await supabase
      .from("enquiry_replies" as any)
      .select("*")
      .in("submission_id", subIds)
      .order("created_at", { ascending: true });

    const repliesMap: Record<string, any[]> = {};
    for (const r of (allReplies as any[]) ?? []) {
      if (!repliesMap[r.submission_id]) repliesMap[r.submission_id] = [];
      repliesMap[r.submission_id].push(r);
    }

    // Only show threads that have at least one reply
    const threadsWithReplies = submissions
      .filter((s) => repliesMap[s.id]?.length > 0)
      .map((s) => ({
        ...s,
        replies: repliesMap[s.id] ?? [],
      }));

    setThreads(threadsWithReplies);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-display text-sm">No messages yet</p>
        <p className="text-xs text-muted-foreground mt-1">When an admin replies to your contact enquiries, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {threads.map((thread) => {
        const isExpanded = expandedId === thread.id;
        const latestReply = thread.replies[thread.replies.length - 1];

        return (
          <div key={thread.id} className="transition-colors">
            <button
              onClick={() => setExpandedId(isExpanded ? null : thread.id)}
              className="w-full p-5 hover:bg-secondary/30 text-left"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">
                      Re: Your enquiry
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {thread.message.substring(0, 80)}{thread.message.length > 80 ? "..." : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {!isExpanded && latestReply && (
                <p className="text-xs text-muted-foreground ml-11 line-clamp-1">
                  Latest reply: {latestReply.message.substring(0, 100)}
                </p>
              )}
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-3">
                {/* Original message */}
                <div className="ml-11 bg-secondary/50 rounded-lg p-4 border border-border">
                  <p className="text-xs font-display text-muted-foreground mb-2 uppercase tracking-wider">Your Message</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{thread.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(thread.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Replies */}
                {thread.replies.map((reply: any) => (
                  <div key={reply.id} className="ml-11 bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-display text-primary tracking-wider uppercase">PAFC Reply</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(reply.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

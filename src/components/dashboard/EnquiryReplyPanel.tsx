import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Send, Loader2, Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export function EnquiryReplyPanel() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, []);

  async function loadEnquiries() {
    setLoading(true);
    const { data } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setEnquiries((data as any[]) ?? []);
    setLoading(false);
  }

  async function loadReplies(submissionId: string) {
    setLoadingReplies(submissionId);
    const { data } = await supabase
      .from("enquiry_replies" as any)
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });
    setReplies((prev) => ({ ...prev, [submissionId]: (data as any[]) ?? [] }));
    setLoadingReplies(null);
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setReplyText("");
    } else {
      setExpandedId(id);
      setReplyText("");
      loadReplies(id);
    }
  }

  async function sendReply(submissionId: string) {
    if (!replyText.trim() || !user) return;
    setSending(true);
    const { error } = await supabase
      .from("enquiry_replies" as any)
      .insert({
        submission_id: submissionId,
        admin_user_id: user.id,
        message: replyText.trim(),
      } as any);

    if (error) {
      toast.error("Failed to send reply");
    } else {
      toast.success("Reply sent");
      setReplyText("");
      loadReplies(submissionId);

      // Notify the user if they have an account (match by email)
      const enquiry = enquiries.find((e) => e.id === submissionId);
      if (enquiry) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", enquiry.email)
          .maybeSingle();

        if (profile) {
          await supabase.from("hub_notifications").insert({
            user_id: profile.id,
            title: "Reply to your enquiry",
            message: `An admin replied to your contact enquiry: "${replyText.trim().substring(0, 100)}${replyText.trim().length > 100 ? "..." : ""}"`,
            type: "info",
            link: "/dashboard?section=messages",
          } as any);
        }
      }
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (enquiries.length === 0) {
    return (
      <div className="text-center py-16">
        <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-display">No enquiries yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {enquiries.map((eq) => {
        const isExpanded = expandedId === eq.id;
        const eqReplies = replies[eq.id] ?? [];

        return (
          <div key={eq.id} className="transition-colors">
            <div className="p-5 hover:bg-secondary/30 cursor-pointer" onClick={() => toggleExpand(eq.id)}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">{eq.name}</p>
                    <span className="text-xs text-primary">{eq.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {eqReplies.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <MessageSquare className="h-3 w-3" />
                      {eqReplies.length}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(eq.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground ml-11 whitespace-pre-wrap line-clamp-2">{eq.message}</p>
            </div>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-4">
                {/* Full message */}
                <div className="ml-11 bg-secondary/50 rounded-lg p-4 border border-border">
                  <p className="text-xs font-display text-muted-foreground mb-2 uppercase tracking-wider">Original Message</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{eq.message}</p>
                </div>

                {/* Existing replies */}
                {loadingReplies === eq.id ? (
                  <div className="ml-11 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading replies...
                  </div>
                ) : eqReplies.length > 0 ? (
                  <div className="ml-11 space-y-3">
                    {eqReplies.map((reply: any) => (
                      <div key={reply.id} className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-display text-primary tracking-wider uppercase">Admin Reply</span>
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
                ) : null}

                {/* Reply form */}
                <div className="ml-11 space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="resize-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!replyText.trim() || sending}
                      onClick={(e) => {
                        e.stopPropagation();
                        sendReply(eq.id);
                      }}
                      className="bg-primary text-primary-foreground font-display tracking-wider"
                    >
                      {sending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                      {sending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

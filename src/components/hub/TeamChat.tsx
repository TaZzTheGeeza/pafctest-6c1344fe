import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Hash, Plus, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  team_slug: string | null;
  channel_type: string;
}

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function TeamChat({ teamSlug }: { teamSlug: string }) {
  const { user, isCoach, isAdmin } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveChannel(null);
    setMessages([]);
    loadChannels();
  }, [teamSlug]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);
      const channel = supabase
        .channel(`hub-messages-${activeChannel.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "hub_messages", filter: `channel_id=eq.${activeChannel.id}` }, (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          loadProfileFor(msg.user_id);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChannels() {
    const { data } = await supabase.from("hub_channels").select("*").eq("team_slug", teamSlug).order("created_at");
    if (data) {
      setChannels(data);
      if (data.length > 0) setActiveChannel(data[0]);
    }
  }

  async function loadMessages(channelId: string) {
    const { data } = await supabase.from("hub_messages").select("*").eq("channel_id", channelId).order("created_at").limit(200);
    if (data) {
      setMessages(data);
      const userIds = [...new Set(data.map((m) => m.user_id))];
      for (const uid of userIds) loadProfileFor(uid);
    }
  }

  async function loadProfileFor(userId: string) {
    if (profiles[userId]) return;
    const { data } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
    if (data) {
      setProfiles((prev) => ({ ...prev, [userId]: data.full_name || data.email || "Unknown" }));
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !user) return;
    const { error } = await supabase.from("hub_messages").insert({ channel_id: activeChannel.id, user_id: user.id, content: newMessage.trim() });
    if (error) { toast.error("Failed to send message"); return; }
    setNewMessage("");
  }

  async function createChannel() {
    if (!newChannelName.trim()) return;
    const { error } = await supabase.from("hub_channels").insert({ name: newChannelName.trim(), team_slug: teamSlug, created_by: user?.id });
    if (error) { toast.error("Failed to create channel"); return; }
    setNewChannelName("");
    setShowNewChannel(false);
    loadChannels();
    toast.success("Channel created!");
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Sign in to access team chat</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0 bg-card border border-border rounded-xl overflow-hidden h-[600px]">
      {/* Channel Sidebar */}
      <div className="border-r border-border bg-secondary/30 p-3 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground uppercase">Channels</h3>
          {(isCoach || isAdmin) && (
            <button onClick={() => setShowNewChannel(!showNewChannel)} className="text-primary hover:text-primary/80">
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        {showNewChannel && (
          <div className="flex gap-1 mb-2">
            <input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="Channel name" className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground" onKeyDown={(e) => e.key === "Enter" && createChannel()} />
            <button onClick={createChannel} className="text-xs text-primary font-display">Add</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {channels.map((ch) => (
            <button key={ch.id} onClick={() => setActiveChannel(ch)} className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeChannel?.id === ch.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-display text-xs tracking-wider">{ch.name}</span>
            </button>
          ))}
          {channels.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No channels yet</p>
              {(isCoach || isAdmin) && <p className="text-[10px] text-muted-foreground mt-1">Create one with the + button</p>}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex flex-col">
        {activeChannel ? (
          <>
            <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-display text-sm font-bold text-foreground">{activeChannel.name}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
              )}
              {messages.map((msg, i) => {
                const isOwn = msg.user_id === user.id;
                const showAvatar = i === 0 || messages[i - 1].user_id !== msg.user_id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                      {showAvatar && (
                        <p className={`text-[10px] font-display tracking-wider mb-0.5 ${isOwn ? "text-right text-primary" : "text-muted-foreground"}`}>
                          {isOwn ? "You" : profiles[msg.user_id] || "Loading..."}
                        </p>
                      )}
                      <div className={`rounded-xl px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {msg.content}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{format(new Date(msg.created_at), "HH:mm")}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <button type="submit" disabled={!newMessage.trim()} className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            {channels.length === 0 ? "No channels created yet" : "Select a channel to start chatting"}
          </div>
        )}
      </div>
    </div>
  );
}

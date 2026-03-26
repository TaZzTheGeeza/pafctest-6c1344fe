import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Hash, Plus, Users, ImagePlus, Loader2, X } from "lucide-react";
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

const IMAGE_PREFIX = "[img:";
const IMAGE_SUFFIX = "]";

function parseMessage(content: string) {
  // Supports mixed text + images: text [img:url] more text
  const parts: { type: "text" | "image"; value: string }[] = [];
  let remaining = content;
  while (remaining.length > 0) {
    const start = remaining.indexOf(IMAGE_PREFIX);
    if (start === -1) {
      if (remaining.trim()) parts.push({ type: "text", value: remaining });
      break;
    }
    if (start > 0) {
      const text = remaining.slice(0, start).trim();
      if (text) parts.push({ type: "text", value: text });
    }
    const end = remaining.indexOf(IMAGE_SUFFIX, start + IMAGE_PREFIX.length);
    if (end === -1) {
      parts.push({ type: "text", value: remaining });
      break;
    }
    const url = remaining.slice(start + IMAGE_PREFIX.length, end);
    parts.push({ type: "image", value: url });
    remaining = remaining.slice(end + 1);
    continue;
  }
  return parts.length > 0 ? parts : [{ type: "text" as const, value: content }];
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
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !activeChannel) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }

    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `chat/${teamSlug}/${activeChannel.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("club-photos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("club-photos").getPublicUrl(path);
      setPendingImageUrl(urlData.publicUrl);
    } catch (err) {
      toast.error("Failed to upload image");
      setImagePreview(null);
      setPendingImageUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function cancelImage() {
    setImagePreview(null);
    setPendingImageUrl(null);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChannel || !user) return;
    const text = newMessage.trim();
    const imgUrl = pendingImageUrl;

    if (!text && !imgUrl) return;

    let content = "";
    if (text) content += text;
    if (imgUrl) content += (text ? " " : "") + `${IMAGE_PREFIX}${imgUrl}${IMAGE_SUFFIX}`;

    const { error } = await supabase.from("hub_messages").insert({ channel_id: activeChannel.id, user_id: user.id, content });
    if (error) { toast.error("Failed to send message"); return; }
    setNewMessage("");
    setImagePreview(null);
    setPendingImageUrl(null);
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
    <>
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
                  const parts = parseMessage(msg.content);
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                        {showAvatar && (
                          <p className={`text-[10px] font-display tracking-wider mb-0.5 ${isOwn ? "text-right text-primary" : "text-muted-foreground"}`}>
                            {isOwn ? "You" : profiles[msg.user_id] || "Loading..."}
                          </p>
                        )}
                        <div className={`rounded-xl px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                          {parts.map((part, pi) =>
                            part.type === "image" ? (
                              <img
                                key={pi}
                                src={part.value}
                                alt="Shared image"
                                loading="lazy"
                                onClick={() => setLightboxUrl(part.value)}
                                className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity mt-1 mb-1"
                              />
                            ) : (
                              <span key={pi}>{part.value}</span>
                            )
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{format(new Date(msg.created_at), "HH:mm")}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Image preview */}
              {imagePreview && (
                <div className="px-3 pt-2 flex items-end gap-2">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-border object-cover" />
                    {uploading && (
                      <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                    <button
                      onClick={cancelImage}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2 items-center">
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="Attach image"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !pendingImageUrl) || uploading}
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button className="absolute top-4 right-4 text-foreground hover:text-primary" onClick={() => setLightboxUrl(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </>
  );
}

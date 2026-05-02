import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Send, User as UserIcon, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";

export const Messages = () => {
  const { user, profile, role } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      // Fetch all users to chat with (excluding self)
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, user_roles!inner(role)")
        .neq("id", user?.id);
      
      // If member, maybe prioritize admins or just show all
      setUsers(data || []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeUser || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      
      setMessages(data || []);
      scrollToBottom();
      
      // Mark as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", activeUser.id)
        .eq("receiver_id", user.id)
        .eq("read", false);
    };

    fetchMessages();

    const ch = supabase.channel(`messages-${activeUser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new;
        if (
          (msg.sender_id === user.id && msg.receiver_id === activeUser.id) ||
          (msg.sender_id === activeUser.id && msg.receiver_id === user.id)
        ) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [activeUser, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser || !user) return;

    const msgText = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activeUser.id,
      content: msgText,
    });
  };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-140px)] gap-6">
        
        {/* Sidebar: Users List */}
        <div className={`w-full md:w-80 flex-col bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm flex-shrink-0 ${activeUser ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border/60">
            <h2 className="font-semibold mb-3">Direct Messages</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search team..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="pl-9 h-9" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setActiveUser(u)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${activeUser?.id === u.id ? "bg-primary/10" : "hover:bg-secondary"}`}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{u.user_roles[0]?.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Chat Area */}
        <div className={`flex-1 flex-col bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm ${!activeUser ? "hidden md:flex" : "flex"}`}>
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8 opacity-50" />
              </div>
              <p>Select a member to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/60 flex items-center gap-3 bg-secondary/30">
                <button className="md:hidden p-1 mr-2 text-muted-foreground" onClick={() => setActiveUser(null)}>
                  ← Back
                </button>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80" onClick={() => setProfileDialogOpen(true)}>
                  {activeUser.avatar_url ? <img src={activeUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm cursor-pointer hover:underline" onClick={() => setProfileDialogOpen(true)}>{activeUser.full_name}</h3>
                  <p className="text-[11px] text-muted-foreground capitalize">{activeUser.user_roles[0]?.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setProfileDialogOpen(true)}>
                  <Info className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-10">No messages yet. Say hi!</div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i-1].created_at).getTime() > 5 * 60000;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {showTime && <span className="text-[10px] text-muted-foreground mb-2 mt-2">{format(new Date(msg.created_at), "h:mm a")}</span>}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          isMe 
                            ? "bg-primary text-primary-foreground rounded-tr-sm" 
                            : "bg-secondary text-foreground rounded-tl-sm"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={sendMessage} className="p-3 border-t border-border/60 bg-secondary/10 flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full h-10 px-4 bg-background border-border"
                />
                <Button type="submit" disabled={!newMessage.trim()} size="icon" className="rounded-full w-10 h-10 flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </form>
            </>
          )}
        </div>

      </div>
      <UserProfileDialog 
        userId={activeUser?.id} 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </AppShell>
  );
};

export default Messages;

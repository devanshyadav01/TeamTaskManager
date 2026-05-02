import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Bell, Check, Loader2, Megaphone, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Inbox = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    const ch = supabase.channel(`notifications-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Inbox</h1>
            <p className="text-sm text-muted-foreground">Your notifications and broadcasts.</p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <Check className="w-4 h-4" /> Mark all as read
            </Button>
          )}
        </motion.div>

        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center text-muted-foreground">
              <Bell className="w-12 h-12 opacity-20 mb-3" />
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((n, i) => {
                const isTask = n.type === "task_assigned" || n.type === "task_update";
                const isBroadcast = n.type === "broadcast";
                
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("p-4 flex gap-4 transition-colors", !n.read ? "bg-primary/5" : "hover:bg-secondary/40")}
                    onClick={() => !n.read && markAsRead(n.id)}
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1", 
                      isBroadcast ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                    )}>
                      {isBroadcast ? <Megaphone className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn("text-sm font-semibold", !n.read && "text-foreground")}>{n.title}</h3>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                      {n.link && (
                        <a href={n.link} className="inline-block mt-2 text-xs font-medium text-primary hover:underline">
                          View Details →
                        </a>
                      )}
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Inbox;

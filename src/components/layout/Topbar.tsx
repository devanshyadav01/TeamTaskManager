import { useEffect, useState } from "react";
import { Bell, Search, Plus, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

export const Topbar = ({ onNewAction }: { onNewAction?: () => void }) => {
  const { user, role } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState<any[]>([]);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const stored = localStorage.getItem("tf-theme");
    if (stored === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15);
      setNotifications(data || []);
    };
    load();
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tf-theme", next ? "dark" : "light");
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border/60">
      <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks, projects, people…"
            className="w-full h-10 pl-9 pr-16 text-sm rounded-lg bg-secondary/70 border border-transparent focus:border-ring focus:bg-card focus:outline-none focus:ring-4 focus:ring-ring/10 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-card border border-border text-muted-foreground">⌘K</kbd>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {role === "admin" && onNewAction && (
            <Button size="sm" onClick={onNewAction} className="hidden sm:inline-flex gap-1.5 h-9 text-primary-foreground border-0" style={{ background: "var(--gradient-primary)" }}>
              <Plus className="w-4 h-4" /> New Task
            </Button>
          )}
          <button onClick={toggleTheme} className="w-9 h-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors" title="Toggle theme">
            {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="relative w-9 h-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
                <Bell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground flex items-center justify-center ring-2 ring-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">You're all caught up 🎉</div>
                ) : notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b border-border/60 hover:bg-secondary/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { History, MessageSquare, CheckSquare, RefreshCw, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdminActivityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("task_activity_log")
      .select(`
        *,
        tasks (title),
        profiles (full_name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes("comment")) return <MessageSquare className="w-4 h-4 text-blue-500" />;
    if (action.includes("status")) return <RefreshCw className="w-4 h-4 text-orange-500" />;
    if (action.includes("created")) return <CheckSquare className="w-4 h-4 text-green-500" />;
    return <History className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionText = (log: any) => {
    const action = log.action;
    const taskName = log.tasks?.title || "a task";
    const userName = log.profiles?.full_name || "System";

    if (action === "task_created") return <><span className="font-medium text-foreground">{userName}</span> created <span className="font-medium">{taskName}</span></>;
    if (action === "status_changed") return <><span className="font-medium text-foreground">{userName}</span> changed status of <span className="font-medium">{taskName}</span> to {log.metadata?.new_status}</>;
    if (action === "task_assigned") return <><span className="font-medium text-foreground">{userName}</span> assigned <span className="font-medium">{taskName}</span></>;
    if (action === "comment_added") return <><span className="font-medium text-foreground">{userName}</span> commented on <span className="font-medium">{taskName}</span></>;
    
    return <><span className="font-medium text-foreground">{userName}</span> {action.replace(/_/g, " ")} on <span className="font-medium">{taskName}</span></>;
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Audit trail of every action taken across tasks and projects.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Loading activity...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center text-muted-foreground">
            <History className="w-12 h-12 mb-4 opacity-20" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:px-6 flex items-start gap-4 hover:bg-secondary/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {log.profiles?.avatar_url ? (
                    <img src={log.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-md bg-secondary/80 flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getActionText(log)}
                    </p>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 text-xs font-mono bg-secondary/40 p-2 rounded-md overflow-x-auto text-muted-foreground">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {format(new Date(log.created_at), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default AdminActivityLog;

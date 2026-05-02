import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const columns: { key: string; title: string; accent: string; statuses: string[] }[] = [
  { key: "todo", title: "To Do", accent: "bg-muted-foreground/40", statuses: ["pending", "accepted"] },
  { key: "progress", title: "In Progress", accent: "bg-warning", statuses: ["in_progress"] },
  { key: "review", title: "In Review", accent: "bg-info", statuses: ["in_review"] },
  { key: "done", title: "Completed", accent: "bg-success", statuses: ["completed"] },
];

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export const TasksKanban = ({ refreshKey }: { refreshKey?: number }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, priority, status, due_date, assignee_user_id, assignee_team_id, assignee_designation_id, profiles:assignee_user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(40);
      setTasks(data || []);
      setLoading(false);
    })();
  }, [refreshKey]);

  return (
    <div className="bg-card border border-border/60 rounded-xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold tracking-tight">Active Sprint Board</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Live view of all team tasks</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {columns.map((col, ci) => {
          const colTasks = tasks.filter(t => col.statuses.includes(t.status));
          return (
            <div key={col.key} className="bg-secondary/50 rounded-xl p-3 min-h-[280px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", col.accent)} />
                  <h4 className="text-sm font-semibold">{col.title}</h4>
                  <span className="text-xs text-muted-foreground tabular-nums">{colTasks.length}</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2.5">
                {loading && Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-card/60 animate-pulse" />
                ))}
                {!loading && colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                )}
                {colTasks.map((t, ti) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.04 + ti * 0.03 }}
                    className="bg-card rounded-lg p-3 border border-border/60 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", priorityStyles[t.priority] || priorityStyles.medium)}>{t.priority}</span>
                      {t.due_date && <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(t.due_date), { addSuffix: true })}</span>}
                    </div>
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    {t.profiles?.full_name && <p className="text-[11px] text-muted-foreground mt-1.5">→ {t.profiles.full_name}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

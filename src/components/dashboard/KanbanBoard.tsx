import { motion } from "framer-motion";
import { MessageSquare, Paperclip, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "critical";
interface Task {
  id: string;
  title: string;
  tag: string;
  priority: Priority;
  assignees: string[];
  comments: number;
  attachments: number;
  due: string;
}

const columns: { key: string; title: string; accent: string; tasks: Task[] }[] = [
  {
    key: "todo", title: "To Do", accent: "bg-muted-foreground/40",
    tasks: [
      { id: "1", title: "Design new onboarding flow for mobile users", tag: "Design", priority: "high", assignees: ["MK", "JL"], comments: 4, attachments: 2, due: "Aug 24" },
      { id: "2", title: "Audit Q3 marketing analytics dashboards", tag: "Marketing", priority: "medium", assignees: ["AS"], comments: 1, attachments: 0, due: "Aug 26" },
    ],
  },
  {
    key: "progress", title: "In Progress", accent: "bg-warning",
    tasks: [
      { id: "3", title: "Implement role-based access middleware", tag: "Backend", priority: "critical", assignees: ["RP", "TM", "DL"], comments: 8, attachments: 3, due: "Aug 22" },
      { id: "4", title: "Refactor task service for real-time sync", tag: "Engineering", priority: "high", assignees: ["RP"], comments: 3, attachments: 1, due: "Aug 25" },
      { id: "5", title: "Create reusable Kanban component", tag: "Frontend", priority: "medium", assignees: ["JL"], comments: 2, attachments: 0, due: "Aug 27" },
    ],
  },
  {
    key: "review", title: "In Review", accent: "bg-info",
    tasks: [
      { id: "6", title: "Optimize API response payload size", tag: "Backend", priority: "medium", assignees: ["TM", "RP"], comments: 5, attachments: 1, due: "Aug 23" },
    ],
  },
  {
    key: "done", title: "Completed", accent: "bg-success",
    tasks: [
      { id: "7", title: "Set up CI/CD pipeline with Railway", tag: "DevOps", priority: "high", assignees: ["DL"], comments: 12, attachments: 4, due: "Aug 18" },
      { id: "8", title: "Brand identity refresh – v2", tag: "Design", priority: "low", assignees: ["MK"], comments: 6, attachments: 8, due: "Aug 16" },
    ],
  },
];

const priorityStyles: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const tagColor = (tag: string) => {
  const map: Record<string, string> = {
    Design: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    Backend: "bg-primary/10 text-primary",
    Frontend: "bg-info/10 text-info",
    Engineering: "bg-primary/10 text-primary",
    Marketing: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    DevOps: "bg-success/10 text-success",
  };
  return map[tag] ?? "bg-muted text-muted-foreground";
};

const avatarBg = ["bg-primary", "bg-success", "bg-warning", "bg-info", "bg-destructive"];

export const KanbanBoard = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-semibold tracking-tight">Active Sprint Board</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Drag tasks across columns to update status</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col, ci) => (
        <div key={col.key} className="bg-secondary/50 rounded-xl p-3 min-h-[280px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", col.accent)} />
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <span className="text-xs text-muted-foreground tabular-nums">{col.tasks.length}</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2.5">
            {col.tasks.map((t, ti) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.05 + ti * 0.04 }}
                whileHover={{ y: -2 }}
                className="bg-card rounded-lg p-3.5 border border-border/60 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide", tagColor(t.tag))}>{t.tag}</span>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", priorityStyles[t.priority])}>{t.priority}</span>
                </div>
                <p className="text-sm font-medium leading-snug mb-3">{t.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {t.assignees.map((a, i) => (
                      <div key={i} className={cn("w-6 h-6 rounded-full ring-2 ring-card flex items-center justify-center text-[10px] font-semibold text-primary-foreground", avatarBg[i % avatarBg.length])}>
                        {a}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    {t.comments > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{t.comments}</span>}
                    {t.attachments > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{t.attachments}</span>}
                    <span>· {t.due}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

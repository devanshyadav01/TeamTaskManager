import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Loader2, CheckSquare, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  accepted: "bg-info/10 text-info",
  rejected: "bg-destructive/10 text-destructive",
  in_progress: "bg-warning/10 text-warning",
  in_review: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
};

export const MemberTasks = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let filterString = `and(assignee_type.eq.user,assignee_user_id.eq.${user.id})`;
    if (profile?.team_id) filterString += `,and(assignee_type.eq.team,assignee_team_id.eq.${profile.team_id})`;
    if (profile?.designation_id) filterString += `,and(assignee_type.eq.designation,assignee_designation_id.eq.${profile.designation_id})`;

    const { data } = await supabase
      .from("tasks")
      .select(`
        *,
        project:projects(name, description)
      `)
      .or(filterString)
      .order("created_at", { ascending: false });
      
    setTasks(data || []);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.project?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Tasks</h1>
        <p className="text-muted-foreground text-sm">Detailed view of all tasks assigned to you and your team.</p>
      </motion.div>

      <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 justify-between items-center bg-secondary/30">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search tasks or projects..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-9" 
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center text-muted-foreground">
              <CheckSquare className="w-12 h-12 opacity-20 mb-3" />
              <p>No tasks found matching your criteria.</p>
            </div>
          ) : (
            filteredTasks.map(t => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg border border-border/60 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">{t.title}</h3>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded capitalize", priorityStyles[t.priority])}>{t.priority}</span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded capitalize border", statusStyles[t.status])}>{t.status.replace("_", " ")}</span>
                    </div>
                    {t.project && (
                      <div className="inline-block mt-1 mb-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          Project: {t.project.name}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{t.description || "No description provided."}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Created: {format(new Date(t.created_at), "MMM d, yyyy")}</span>
                      {t.due_date && <span className="text-warning">Due: {format(new Date(t.due_date), "MMM d, yyyy")}</span>}
                      {t.accepted_at && <span>Accepted: {formatDistanceToNow(new Date(t.accepted_at), { addSuffix: true })}</span>}
                    </div>
                  </div>

                  {/* Right: Progress & Status */}
                  <div className="lg:w-48 flex flex-col gap-2 shrink-0">
                    <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium">Progress</span>
                        <span className="text-xs font-bold">{t.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden border border-border/50">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${t.progress}%`, background: "var(--gradient-primary)" }}
                        />
                      </div>
                    </div>
                    
                    <Select value={t.status} onValueChange={async (val) => {
                      await supabase.from("tasks").update({ status: val }).eq("id", t.id);
                      setTasks(tasks.map(x => x.id === t.id ? { ...x, status: val } : x));
                    }}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default MemberTasks;

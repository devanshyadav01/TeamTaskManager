import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Loader2, Check, X, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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

const MemberDashboard = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!user) return;

    // Build strict OR filter checking both assignee_type and the respective ID
    let filterString = `and(assignee_type.eq.user,assignee_user_id.eq.${user.id})`;
    if (profile?.team_id) {
      filterString += `,and(assignee_type.eq.team,assignee_team_id.eq.${profile.team_id})`;
    }
    if (profile?.designation_id) {
      filterString += `,and(assignee_type.eq.designation,assignee_designation_id.eq.${profile.designation_id})`;
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .or(filterString)
      .order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`mem-tasks-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, user]);

  const updateStatus = async (id: string, status: string, extra: any = {}) => {
    const { error } = await supabase.from("tasks").update({ status, ...extra }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Task ${status.replace("_", " ")}`);
  };
  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : undefined;
    const payload: any = { progress };
    if (status) payload.status = status;
    await supabase.from("tasks").update(payload).eq("id", id);
  };
  const acceptTask = (id: string) => updateStatus(id, "accepted", { accepted_at: new Date().toISOString() });
  const submitReject = async () => {
    if (!rejectFor || !rejectReason.trim()) { toast.error("Reason is required"); return; }
    await updateStatus(rejectFor, "rejected", { rejection_reason: rejectReason.trim() });
    setRejectFor(null); setRejectReason("");
  };

  const pending = tasks.filter(t => t.status === "pending");
  const active = tasks.filter(t => ["accepted", "in_progress", "in_review"].includes(t.status));
  const completed = tasks.filter(t => t.status === "completed").length;
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between mb-7 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-success px-2 py-0.5 rounded-md bg-success/10">Member</span>
            <span className="text-xs text-muted-foreground">· {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Hey, <span className="gradient-text">{profile?.full_name?.split(" ")[0] || "there"}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here are your tasks for today.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Tasks" value={active.length + pending.length} icon={CheckSquare} tone="primary" index={0} />
        <StatCard label="Awaiting Response" value={pending.length} icon={Clock} tone="warning" index={1} />
        <StatCard label="Completed" value={completed} icon={TrendingUp} tone="success" index={2} />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} tone="destructive" index={3} />
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-warning opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-warning" />
            </span>
            Awaiting Your Response ({pending.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pending.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-warning/30 rounded-xl p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{t.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">From {t.creator?.full_name || "Admin"} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", priorityStyles[t.priority])}>{t.priority}</span>
                </div>
                {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => acceptTask(t.id)} className="flex-1 h-8 gap-1 bg-success hover:bg-success/90 text-success-foreground border-0">
                    <Check className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectFor(t.id)} className="flex-1 h-8 gap-1 hover:border-destructive hover:text-destructive">
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-3">In Progress ({active.length})</h2>
        <div className="bg-card border border-border/60 rounded-xl divide-y divide-border" style={{ boxShadow: "var(--shadow-sm)" }}>
          {loading && <div className="p-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
          {!loading && active.length === 0 && (
            <div className="p-12 text-center">
              <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">No active tasks</p>
              <p className="text-xs text-muted-foreground mt-1">When you accept a task, it will show here.</p>
            </div>
          )}
          {active.map((t) => (
            <div key={t.id} className="p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{t.title}</h3>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", priorityStyles[t.priority])}>{t.priority}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", statusStyles[t.status])}>{t.status.replace("_", " ")}</span>
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>}
                  {t.due_date && <p className="text-[11px] text-muted-foreground mt-1">Due {formatDistanceToNow(new Date(t.due_date), { addSuffix: true })}</p>}
                </div>
                <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Slider
                    value={[t.progress]}
                    max={100}
                    step={5}
                    onValueChange={(v) => setTasks(tasks.map(x => x.id === t.id ? { ...x, progress: v[0] } : x))}
                    onValueCommit={(v) => updateProgress(t.id, v[0])}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums w-10 text-right">{t.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!rejectFor} onOpenChange={(b) => !b && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Please share a reason for rejecting this task. The admin will be notified.</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. I'm currently at capacity with another deadline this week…" rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
              <Button onClick={submitReject} variant="destructive">Submit rejection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default MemberDashboard;

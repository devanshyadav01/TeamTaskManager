import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, Filter } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { TeamProgress } from "@/components/dashboard/TeamProgress";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TasksKanban } from "@/components/dashboard/TasksKanban";

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = useCallback(async () => {
    const now = new Date().toISOString();
    const [total, inProg, done, overdue] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", now).neq("status", "completed"),
    ]);
    setStats({
      total: total.count ?? 0,
      in_progress: inProg.count ?? 0,
      completed: done.count ?? 0,
      overdue: overdue.count ?? 0,
    });
  }, []);

  useEffect(() => {
    loadStats();
    const ch = supabase.channel("admin-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        loadStats();
        setRefreshKey(k => k + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadStats]);

  return (
    <AppShell onNewTask={() => setOpen(true)}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10">Admin</span>
            <span className="text-xs text-muted-foreground">· Live workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, <span className="gradient-text">{profile?.full_name?.split(" ")[0] || "Admin"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your teams in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5"><Filter className="w-4 h-4" /> Filter</Button>
          <Button size="sm" onClick={() => setOpen(true)} className="h-9 gap-1.5 text-primary-foreground border-0" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tasks" value={stats.total} icon={CheckSquare} tone="primary" index={0} />
        <StatCard label="In Progress" value={stats.in_progress} icon={Clock} tone="warning" index={1} />
        <StatCard label="Completed" value={stats.completed} icon={TrendingUp} tone="success" index={2} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} tone="destructive" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2"><ActivityChart /></div>
        <TeamProgress />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2"><TasksKanban refreshKey={refreshKey} /></div>
        <RecentActivity />
      </div>

      <NewTaskDialog open={open} onOpenChange={setOpen} onCreated={loadStats} />
    </AppShell>
  );
};

export default AdminDashboard;

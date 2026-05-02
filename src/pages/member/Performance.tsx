import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckSquare, TrendingUp, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays, isSameDay } from "date-fns";

const COLORS = {
  pending: "hsl(var(--muted-foreground))",
  accepted: "hsl(var(--info))",
  in_progress: "hsl(var(--warning))",
  in_review: "hsl(var(--primary))",
  completed: "hsl(var(--success))",
};

export const Performance = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let filterString = `and(assignee_type.eq.user,assignee_user_id.eq.${user.id})`;
    if (profile?.team_id) filterString += `,and(assignee_type.eq.team,assignee_team_id.eq.${profile.team_id})`;
    if (profile?.designation_id) filterString += `,and(assignee_type.eq.designation,assignee_designation_id.eq.${profile.designation_id})`;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .or(filterString);
      
    setTasks(data || []);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Derived Stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in_progress" || t.status === "accepted").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Pie Chart Data
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status.replace("_", " "),
    value: statusCounts[status],
    color: COLORS[status as keyof typeof COLORS] || COLORS.pending
  }));

  // Area Chart Data (Last 7 days completion vs created)
  // Simplified to just show tasks completed by day for demonstration
  const areaData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayTasks = tasks.filter(t => t.status === "completed" && t.updated_at && isSameDay(new Date(t.updated_at), d));
    return {
      date: format(d, "EEE"),
      completed: dayTasks.length
    };
  });

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-muted-foreground text-sm">Track your task completion and productivity over time.</p>
      </motion.div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Assigned" value={total} icon={CheckSquare} tone="primary" index={0} />
            <StatCard label="In Progress" value={inProgress} icon={Clock} tone="warning" index={1} />
            <StatCard label="Completed" value={completed} icon={TrendingUp} tone="success" index={2} />
            <StatCard label="Completion Rate" value={`${completionRate}%`} icon={AlertTriangle} tone={completionRate > 50 ? "success" : "destructive"} index={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown */}
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Task Breakdown</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2 text-xs">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 capitalize">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Completion */}
            <div className="lg:col-span-2 bg-card border border-border/60 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Tasks Completed (Last 7 Days)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Area type="monotone" dataKey="completed" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
};

export default Performance;

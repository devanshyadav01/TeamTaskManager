import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const data = [
  { d: "Mon", completed: 12, created: 18 },
  { d: "Tue", completed: 19, created: 22 },
  { d: "Wed", completed: 15, created: 14 },
  { d: "Thu", completed: 28, created: 30 },
  { d: "Fri", completed: 24, created: 26 },
  { d: "Sat", completed: 10, created: 8 },
  { d: "Sun", completed: 16, created: 12 },
];

export const ActivityChart = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6 h-full" style={{ boxShadow: 'var(--shadow-sm)' }}>
    <div className="flex items-start justify-between mb-1">
      <div>
        <h3 className="font-semibold tracking-tight">Task Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Created vs completed this week</p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Created</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" />Completed</span>
      </div>
    </div>
    <div className="h-[260px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, boxShadow: 'var(--shadow-lg)' }}
          />
          <Area type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)" />
          <Area type="monotone" dataKey="completed" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#g2)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

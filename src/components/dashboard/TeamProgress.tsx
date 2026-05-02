const teams = [
  { name: "Engineering", progress: 78, color: "hsl(var(--primary))", tasks: 42 },
  { name: "Design", progress: 92, color: "hsl(var(--success))", tasks: 18 },
  { name: "Marketing", progress: 64, color: "hsl(var(--warning))", tasks: 27 },
  { name: "Product", progress: 51, color: "hsl(var(--info))", tasks: 31 },
];

export const TeamProgress = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6 h-full" style={{ boxShadow: 'var(--shadow-sm)' }}>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-semibold tracking-tight">Team Workload</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Completion this sprint</p>
      </div>
      <button className="text-xs font-medium text-primary hover:underline">View all</button>
    </div>
    <div className="space-y-5">
      {teams.map((t) => (
        <div key={t.name}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              <span className="text-sm font-medium">{t.name}</span>
              <span className="text-[11px] text-muted-foreground">· {t.tasks} tasks</span>
            </div>
            <span className="text-xs font-semibold tabular-nums">{t.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.progress}%`, background: t.color }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

import { CheckCircle2, MessageSquare, UserPlus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  { icon: CheckCircle2, tone: "text-success bg-success/10", who: "Maya K.", action: "completed", target: "Brand identity refresh – v2", time: "2m ago" },
  { icon: MessageSquare, tone: "text-info bg-info/10", who: "Ravi P.", action: "commented on", target: "Implement RBAC middleware", time: "12m ago" },
  { icon: UserPlus, tone: "text-primary bg-primary/10", who: "Admin", action: "added", target: "Daniel L. to Engineering", time: "1h ago" },
  { icon: AlertCircle, tone: "text-destructive bg-destructive/10", who: "System", action: "flagged overdue", target: "Audit Q3 analytics", time: "3h ago" },
  { icon: CheckCircle2, tone: "text-success bg-success/10", who: "Tomás M.", action: "completed", target: "API payload optimization", time: "5h ago" },
];

export const RecentActivity = () => (
  <div className="bg-card border border-border/60 rounded-xl p-6 h-full" style={{ boxShadow: 'var(--shadow-sm)' }}>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-semibold tracking-tight">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Live updates from your team</p>
      </div>
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-success">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-60 animate-ping" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-success" />
        </span>
        Live
      </span>
    </div>
    <ul className="space-y-3.5">
      {events.map((e, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", e.tone)}>
            <e.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">
              <span className="font-semibold">{e.who}</span>{" "}
              <span className="text-muted-foreground">{e.action}</span>{" "}
              <span className="font-medium">{e.target}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{e.time}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

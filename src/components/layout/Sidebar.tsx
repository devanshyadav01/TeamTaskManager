import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3, MessageSquare, Calendar, Settings, Sparkles, LogOut, Activity, Trophy, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/admin/teams", label: "Teams", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/activity", label: "Activity Log", icon: Activity },
];

const memberNav = [
  { to: "/member", label: "My Workspace", icon: LayoutDashboard },
  { to: "/member/tasks", label: "My Tasks", icon: CheckSquare },
  { to: "/member/inbox", label: "Inbox", icon: Inbox },
  { to: "/member/messages", label: "Messages", icon: MessageSquare },
  { to: "/member/calendar", label: "Calendar", icon: Calendar },
  { to: "/member/performance", label: "Performance", icon: Trophy },
];

export const Sidebar = () => {
  const { role, profile, signOut } = useAuth();
  const nav = role === "admin" ? adminNav : memberNav;
  const initials = (profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="px-6 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-[15px] tracking-tight">TaskFlow Pro</h1>
          <p className="text-[11px] text-muted-foreground capitalize">{role} workspace</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {role === "admin" ? "Manage" : "Workspace"}
        </p>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/member"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <NavLink to={role === "admin" ? "/admin/settings" : "/member/settings"} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60">
          <Settings className="w-[18px] h-[18px]" /> Settings
        </NavLink>
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/60">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight">{profile?.full_name || "User"}</p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{profile?.email}</p>
          </div>
          <button onClick={signOut} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-card text-muted-foreground hover:text-destructive transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

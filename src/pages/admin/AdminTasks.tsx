import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, User, Users, Briefcase } from "lucide-react";

export const AdminTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      // Fetch tasks along with their assigned user, team, or designation and project details
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects (name),
          profiles:assignee_user_id (full_name, avatar_url),
          teams:assignee_team_id (name, icon, color),
          designations:assignee_designation_id (name)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setTasks(data);
      }
      setLoading(false);
    };

    fetchTasks();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive"; // Shadcn doesn't have orange by default, destructive is red
      case "medium": return "warning";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "in_progress": return "warning";
      case "in_review": return "default";
      case "rejected": return "destructive";
      case "accepted": return "primary";
      default: return "secondary";
    }
  };

  const getAssigneeInfo = (task: any) => {
    if (task.assignee_type === 'user' && task.profiles) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {task.profiles.avatar_url ? (
              <img src={task.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-sm font-medium">{task.profiles.full_name}</span>
        </div>
      );
    }
    if (task.assignee_type === 'team' && task.teams) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: task.teams.color || '#ccc' }}>
            <Users className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium">{task.teams.name}</span>
        </div>
      );
    }
    if (task.assignee_type === 'designation' && task.designations) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="w-4 h-4" />
          <span className="text-sm font-medium">{task.designations.name}</span>
        </div>
      );
    }
    return <span className="text-muted-foreground italic text-xs">Unassigned</span>;
  };

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive view of all tasks across projects and teams.</p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center text-muted-foreground">
            <CheckSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks found in the system.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    {task.title}
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] mt-0.5">{task.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.projects?.name || "—"}
                  </TableCell>
                  <TableCell>
                    {getAssigneeInfo(task)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(task.status) as any} className="capitalize text-[10px]">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority) as any} className="capitalize text-[10px]">
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  );
};

export default AdminTasks;

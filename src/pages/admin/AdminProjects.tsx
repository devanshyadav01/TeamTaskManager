import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { FolderGit2, Calendar, CheckCircle2, CircleDashed, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const AdminProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          teams (
            name,
            icon,
            color
          )
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const activeProjects = projects.filter(p => p.status !== "completed" && p.status !== "archived");
  const completedProjects = projects.filter(p => p.status === "completed");

  const ProjectCard = ({ project }: { project: any }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/60 p-5 rounded-xl flex flex-col hover:border-primary/30 transition-colors shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary text-primary">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{project.name}</h3>
            {project.teams && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.teams.color || '#ccc' }}></span>
                {project.teams.name}
              </p>
            )}
          </div>
        </div>
        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="capitalize text-[10px]">
          {project.status.replace("_", " ")}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
        {project.description || "No description provided."}
      </p>

      <div className="mt-auto space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="font-semibold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" indicatorColor={project.status === 'completed' ? 'bg-green-500' : 'bg-primary'} />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {project.due_date ? format(new Date(project.due_date), "MMM d, yyyy") : "No due date"}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Projects Workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and track all organizational projects.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-secondary/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CircleDashed className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Active Projects</h2>
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">{activeProjects.length}</Badge>
            </div>
            
            {activeProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-xl border-border/60 bg-secondary/20 text-muted-foreground text-sm">
                No active projects found.
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold tracking-tight">Completed Projects</h2>
              <Badge variant="secondary" className="ml-2">{completedProjects.length}</Badge>
            </div>
            
            {completedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-xl border-border/60 bg-secondary/20 text-muted-foreground text-sm">
                No completed projects found.
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
};

export default AdminProjects;

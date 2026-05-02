import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Shield, BookOpen, Code, Palette, Zap } from "lucide-react";

export const AdminTeams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      // Fetch teams along with their members (profiles) to show member count
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          profiles(id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setTeams(data);
      }
      setLoading(false);
    };

    fetchTeams();
  }, []);

  // Helper to render icon based on string
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'shield': return <Shield className={className} />;
      case 'book-open': return <BookOpen className={className} />;
      case 'code': return <Code className={className} />;
      case 'palette': return <Palette className={className} />;
      case 'zap': return <Zap className={className} />;
      default: return <Users className={className} />;
    }
  };

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Teams Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and view all teams across the organization.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-secondary/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center bg-card border border-border/60 rounded-xl">
          <Users className="w-12 h-12 mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium">No teams found</h3>
          <p className="text-sm text-muted-foreground mt-1">Teams will appear here once created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/30 transition-colors shadow-sm flex flex-col"
            >
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: team.color || 'var(--primary)' }} 
              />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: team.color || 'var(--primary)' }}
                  >
                    {getIcon(team.icon, "w-6 h-6")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">{team.profiles?.length || 0} members</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {team.description || "No description provided."}
                </p>

                {team.profiles && team.profiles.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-border/40">
                    <div className="flex -space-x-2 overflow-hidden">
                      {team.profiles.slice(0, 5).map((profile: any) => (
                        <div key={profile.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" title={profile.full_name} />
                          ) : (
                            <span className="text-[10px] font-medium" title={profile.full_name}>
                              {profile.full_name?.substring(0, 2).toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                      ))}
                      {team.profiles.length > 5 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-secondary/80 flex items-center justify-center text-[10px] font-medium">
                          +{team.profiles.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default AdminTeams;

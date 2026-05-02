import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Briefcase, Users, User as UserIcon } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  team: { name: string } | null;
  designation: { name: string } | null;
}

export const UserProfileDialog = ({ userId, open, onOpenChange }: { userId: string | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`
          id, full_name, email, avatar_url, bio,
          team:teams(name),
          designation:designations(name)
        `)
        .eq("id", userId)
        .single();
      
      setProfile(data as unknown as UserProfile);
      setLoading(false);
    })();
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>
        {loading || !profile ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden mb-4 border-2 border-border/60">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/50 rounded-xl">
              <div className="bg-card p-3 rounded-lg border border-border/60 flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Team</p>
                  <p className="text-sm font-medium">{profile.team?.name || "Unassigned"}</p>
                </div>
              </div>
              <div className="bg-card p-3 rounded-lg border border-border/60 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Role</p>
                  <p className="text-sm font-medium">{profile.designation?.name || "Member"}</p>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="bg-secondary/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-xs font-semibold mb-2 uppercase text-muted-foreground tracking-wider">About</h3>
                <p className="text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

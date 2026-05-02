import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";

export const Settings = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, bio, avatar_url: avatarUrl })
        .eq("id", user.id);
      
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <div className="bg-card border border-border/60 rounded-xl p-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/60">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{fullName || "Your Profile"}</h2>
              <p className="text-sm text-muted-foreground">Manage your personal information.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="text-sm">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="avatarUrl" className="text-sm">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Paste a link to an image to use as your avatar.</p>
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little bit about yourself..."
                rows={4}
                className="mt-1.5"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="gap-2 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
};

export default Settings;

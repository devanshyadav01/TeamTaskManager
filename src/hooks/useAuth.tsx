import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "member";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  team_id: string | null;
  designation_id: string | null;
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      // defer DB calls
      setTimeout(() => fetchUserData(sess.user.id), 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchUserData(sess.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    setRole((roleRow?.role as AppRole) ?? "member");
    setProfile(profileRow as Profile | null);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Allow the router to handle redirection naturally through state changes
    // avoiding a full page reload that triggers Vercel 404s for SPAs
  };

  return { session, user, role, profile, loading, signOut };
};

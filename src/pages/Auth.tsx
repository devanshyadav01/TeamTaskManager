import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Sparkles, Mail, Lock, User as UserIcon, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});
const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Full name required").max(100),
  role: z.enum(["admin", "member"]),
});

const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "member" as "admin" | "member" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) routeByRole(session.user.id);
    });
  }, []);

  const routeByRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    navigate(data?.role === "admin" ? "/admin" : "/member", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (tab === "login") {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])));
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) throw error;
        toast.success("Welcome back!");
        if (data.user) await routeByRole(data.user.id);
      } else {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          setErrors(Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])));
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.full_name, role: parsed.data.role },
          },
        });
        if (error) throw error;
        toast.success("Account created! Welcome to TaskFlow Pro.");
        if (data.user) await routeByRole(data.user.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 mesh-bg opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">TaskFlow Pro</h1>
              <p className="text-xs text-white/70">Enterprise Edition</p>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tight leading-tight">
              Where teams ship<br />work that matters.
            </h2>
            <p className="text-white/80 mt-3 text-base max-w-md">
              Real-time collaboration, role-based workflows, and analytics built for modern companies.
            </p>
          </div>
          <ul className="space-y-2.5">
            {["Role-based admin & member workspaces", "Real-time task sync across your team", "Smart assignment by role or designation", "Built-in chat, comments & notifications"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="w-4 h-4 text-white" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-3 text-xs text-white/70">
          <div className="flex -space-x-2">
            {["A", "M", "R"].map((c) => (
              <div key={c} className="w-7 h-7 rounded-full bg-white/30 backdrop-blur ring-2 ring-primary flex items-center justify-center text-[10px] font-semibold">{c}</div>
            ))}
          </div>
          Trusted by teams at fast-moving companies.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 lg:p-12 mesh-bg">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">TaskFlow Pro</span>
          </div>

          <div className="inline-flex p-1 bg-secondary rounded-lg mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === t ? "text-foreground" : "text-muted-foreground"}`}
              >
                {tab === t && <motion.span layoutId="tab-pill" className="absolute inset-0 bg-card rounded-md shadow-sm" />}
                <span className="relative">{t === "login" ? "Sign in" : "Sign up"}</span>
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {tab === "login" ? "Sign in to continue to your workspace." : "Start managing your team in minutes."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {tab === "signup" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <div>
                    <Label htmlFor="full_name" className="text-xs font-medium">Full name</Label>
                    <div className="relative mt-1.5">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Alex Stone" className="pl-9 h-11" />
                    </div>
                    {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">I am signing up as</Label>
                    <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                      <SelectTrigger className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">👑 Admin — manage teams & assign tasks</SelectItem>
                        <SelectItem value="member">👤 Member — receive & complete tasks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className="pl-9 h-11" />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="pl-9 h-11" />
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 text-primary-foreground border-0 gap-2 font-medium" style={{ background: "var(--gradient-primary)" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{tab === "login" ? "Sign in" : "Create account"} <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing you agree to our <Link to="#" className="underline">Terms</Link> and <Link to="#" className="underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;

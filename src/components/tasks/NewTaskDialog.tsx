import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, User, Users, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().max(2000).optional(),
});

type Mode = "user" | "team" | "designation";

export const NewTaskDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (b: boolean) => void; onCreated?: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [dueDate, setDueDate] = useState("");
  const [mode, setMode] = useState<Mode>("user");
  const [assigneeUser, setAssigneeUser] = useState<string>("");
  const [assigneeTeam, setAssigneeTeam] = useState<string>("");
  const [assigneeDesignation, setAssigneeDesignation] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [m, t, d] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("teams").select("id, name, color"),
        supabase.from("designations").select("id, name, team_id"),
      ]);
      setMembers(m.data || []);
      setTeams(t.data || []);
      setDesignations(d.data || []);
    })();
  }, [open]);

  const reset = () => {
    setStep(1); setTitle(""); setDescription(""); setPriority("medium"); setDueDate("");
    setMode("user"); setAssigneeUser(""); setAssigneeTeam(""); setAssigneeDesignation("");
  };

  const handleClose = (b: boolean) => { if (!b) reset(); onOpenChange(b); };

  const filteredDesignations = designations.filter((d) => !assigneeTeam || d.team_id === assigneeTeam);

  const canStep2 = title.trim().length >= 3;
  const canSubmit =
    canStep2 &&
    ((mode === "user" && assigneeUser) ||
      (mode === "team" && assigneeTeam) ||
      (mode === "designation" && assigneeDesignation));

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ title, description });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setLoading(true);
    try {
      const payload: any = {
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority, status: "pending",
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        created_by: user.id,
        assignee_type: mode,
        assignee_user_id: mode === "user" ? assigneeUser : null,
        assignee_team_id: mode === "team" ? assigneeTeam : (mode === "designation" ? designations.find(d => d.id === assigneeDesignation)?.team_id : null),
        assignee_designation_id: mode === "designation" ? assigneeDesignation : null,
      };
      const { data: task, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error) throw error;

      // Send notifications to relevant users
      let recipientIds: string[] = [];
      if (mode === "user") recipientIds = [assigneeUser];
      else if (mode === "team") {
        const { data } = await supabase.from("profiles").select("id").eq("team_id", assigneeTeam);
        recipientIds = (data || []).map(p => p.id);
      } else {
        const { data } = await supabase.from("profiles").select("id").eq("designation_id", assigneeDesignation);
        recipientIds = (data || []).map(p => p.id);
      }
      if (recipientIds.length) {
        await supabase.from("notifications").insert(recipientIds.map(uid => ({
          user_id: uid, type: "task_assigned", title: "New task assigned to you", body: parsed.data.title, link: `/member/tasks`,
        })));
      }

      toast.success(`Task created and assigned to ${recipientIds.length} ${recipientIds.length === 1 ? "person" : "people"}`);
      onCreated?.();
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create new task</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Step {step} of 3 — {step === 1 ? "Basics" : step === 2 ? "Assignment" : "Review"}</p>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build new onboarding flow" className="h-11 mt-1.5" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context, acceptance criteria, links…" rows={4} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Due date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 mt-1.5" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!canStep2} className="text-primary-foreground border-0" style={{ background: "var(--gradient-primary)" }}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <Label className="text-xs">Assign to</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "user", icon: User, label: "Specific Member", desc: "One person" },
                { v: "team", icon: Users, label: "Entire Team", desc: "All members" },
                { v: "designation", icon: Target, label: "By Role", desc: "All with role" },
              ] as const).map((opt) => (
                <button key={opt.v} type="button" onClick={() => setMode(opt.v)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${mode === opt.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <opt.icon className={`w-5 h-5 mb-2 ${mode === opt.v ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>

            {mode === "user" && (
              <div>
                <Label className="text-xs">Member</Label>
                <Select value={assigneeUser} onValueChange={setAssigneeUser}>
                  <SelectTrigger className="h-11 mt-1.5"><SelectValue placeholder="Select a member" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name} · {m.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {mode === "team" && (
              <div>
                <Label className="text-xs">Team</Label>
                <Select value={assigneeTeam} onValueChange={setAssigneeTeam}>
                  <SelectTrigger className="h-11 mt-1.5"><SelectValue placeholder="Select a team" /></SelectTrigger>
                  <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {mode === "designation" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Team</Label>
                  <Select value={assigneeTeam} onValueChange={(v) => { setAssigneeTeam(v); setAssigneeDesignation(""); }}>
                    <SelectTrigger className="h-11 mt-1.5"><SelectValue placeholder="Pick a team" /></SelectTrigger>
                    <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Role / Designation</Label>
                  <Select value={assigneeDesignation} onValueChange={setAssigneeDesignation} disabled={!assigneeTeam}>
                    <SelectTrigger className="h-11 mt-1.5"><SelectValue placeholder="e.g. Web Developer" /></SelectTrigger>
                    <SelectContent>{filteredDesignations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!canSubmit} className="text-primary-foreground border-0" style={{ background: "var(--gradient-primary)" }}>Review</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 mt-2">
            <div className="bg-secondary/60 rounded-lg p-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{title}</span></div>
              <div><span className="text-muted-foreground">Priority:</span> <span className="font-medium capitalize">{priority}</span></div>
              {dueDate && <div><span className="text-muted-foreground">Due:</span> <span className="font-medium">{dueDate}</span></div>}
              <div>
                <span className="text-muted-foreground">Assignment:</span>{" "}
                <span className="font-medium">
                  {mode === "user" && `Member: ${members.find(m => m.id === assigneeUser)?.full_name}`}
                  {mode === "team" && `Team: ${teams.find(t => t.id === assigneeTeam)?.name}`}
                  {mode === "designation" && `All ${designations.find(d => d.id === assigneeDesignation)?.name}s in ${teams.find(t => t.id === assigneeTeam)?.name}`}
                </span>
              </div>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="text-primary-foreground border-0 gap-2" style={{ background: "var(--gradient-primary)" }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create & Assign
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

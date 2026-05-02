import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { Loader2, Calendar as CalendarIcon, Clock, CheckSquare } from "lucide-react";

export const Calendar = () => {
  const { user, profile } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let filterString = `and(assignee_type.eq.user,assignee_user_id.eq.${user.id})`;
    if (profile?.team_id) filterString += `,and(assignee_type.eq.team,assignee_team_id.eq.${profile.team_id})`;
    if (profile?.designation_id) filterString += `,and(assignee_type.eq.designation,assignee_designation_id.eq.${profile.designation_id})`;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .not("due_date", "is", null)
      .or(filterString);
      
    setTasks(data || []);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const selectedDateTasks = tasks.filter(t => t.due_date && date && isSameDay(new Date(t.due_date), date));
  
  // Custom modifiers for react-day-picker
  const hasTaskDays = tasks.map(t => new Date(t.due_date));

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Side: Calendar */}
        <div className="w-full xl:w-auto xl:flex-shrink-0">
          <h1 className="text-2xl font-bold mb-6">Task Calendar</h1>
          <div className="bg-card border border-border/60 rounded-xl p-4 inline-block shadow-sm">
            <CalendarUI
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              modifiers={{ hasTask: hasTaskDays }}
              modifiersStyles={{
                hasTask: { fontWeight: "bold", textDecoration: "underline", textDecorationColor: "var(--primary)" }
              }}
            />
          </div>
        </div>

        {/* Right Side: Task List for selected day */}
        <div className="flex-1">
          <div className="xl:mt-[3.25rem]">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a day"}
            </h2>
            
            <div className="bg-card border border-border/60 rounded-xl divide-y divide-border/60 shadow-sm min-h-[300px]">
              {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : selectedDateTasks.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-center text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
                  <p>No tasks due on this date.</p>
                </div>
              ) : (
                selectedDateTasks.map(t => (
                  <div key={t.id} className="p-4 hover:bg-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm">{t.title}</h3>
                      {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded capitalize 
                        ${t.priority === 'high' || t.priority === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {t.priority} Priority
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded capitalize
                        ${t.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </AppShell>
  );
};

export default Calendar;

import { AppShell } from "@/components/layout/AppShell";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { TeamProgress } from "@/components/dashboard/TeamProgress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const AdminAnalytics = () => {
  const handleExport = () => {
    toast.success("Analytics report export started");
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep insights into team velocity, task completion rates, and workload distribution.</p>
        </div>
        <Button onClick={handleExport} className="gap-2 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div>
          <TeamProgress />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder for future detailed analytics like member performance or time-tracking */}
        <div className="bg-card border border-border/60 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
          <h3 className="font-semibold text-lg mb-2">Member Performance</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Detailed breakdown of individual member contributions, task completion times, and overall efficiency.
          </p>
          <Button variant="outline" disabled>Coming in next iteration</Button>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm min-h-[300px]">
          <h3 className="font-semibold text-lg mb-2">Time Tracking</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Analysis of estimated vs actual time spent on tasks across different projects and teams.
          </p>
          <Button variant="outline" disabled>Coming in next iteration</Button>
        </div>
      </div>
    </AppShell>
  );
};

export default AdminAnalytics;

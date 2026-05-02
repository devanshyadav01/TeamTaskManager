import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
  index?: number;
}

const toneMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const StatCard = ({ label, value, delta, icon: Icon, tone = "primary", index = 0 }: Props) => {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", toneMap[tone])}>
          <Icon className="w-5 h-5" />
        </div>
        {delta !== undefined && (
          <div className={cn("flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md",
            positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10")}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </motion.div>
  );
};

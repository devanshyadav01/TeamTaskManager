import { AppShell } from "@/components/layout/AppShell";
import { Construction } from "lucide-react";

export const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <AppShell>
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-primary" style={{ background: "var(--gradient-soft)" }}>
        <Construction className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">{description}</p>
      <p className="text-xs text-muted-foreground mt-4">Coming in the next iteration — let me know which page to ship next.</p>
    </div>
  </AppShell>
);

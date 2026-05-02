import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AppShell = ({ children, onNewTask }: { children: ReactNode; onNewTask?: () => void }) => (
  <div className="min-h-screen flex bg-background mesh-bg">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar onNewAction={onNewTask} />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">{children}</main>
    </div>
  </div>
);

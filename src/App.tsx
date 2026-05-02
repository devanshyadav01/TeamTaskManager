import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MemberDashboard from "./pages/member/MemberDashboard";
import MemberTasks from "./pages/member/MemberTasks";
import Calendar from "./pages/member/Calendar";
import Inbox from "./pages/member/Inbox";
import Performance from "./pages/member/Performance";
import Messages from "./pages/Messages";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute requireRole="admin"><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute requireRole="admin"><AdminTasks /></ProtectedRoute>} />
          <Route path="/admin/teams" element={<ProtectedRoute requireRole="admin"><AdminTeams /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requireRole="admin"><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute requireRole="admin"><Messages /></ProtectedRoute>} />
          <Route path="/admin/activity" element={<ProtectedRoute requireRole="admin"><AdminActivityLog /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireRole="admin"><Settings /></ProtectedRoute>} />

          {/* Member */}
          <Route path="/member" element={<ProtectedRoute requireRole="member"><MemberDashboard /></ProtectedRoute>} />
          <Route path="/member/tasks" element={<ProtectedRoute requireRole="member"><MemberTasks /></ProtectedRoute>} />
          <Route path="/member/inbox" element={<ProtectedRoute requireRole="member"><Inbox /></ProtectedRoute>} />
          <Route path="/member/messages" element={<ProtectedRoute requireRole="member"><Messages /></ProtectedRoute>} />
          <Route path="/member/calendar" element={<ProtectedRoute requireRole="member"><Calendar /></ProtectedRoute>} />
          <Route path="/member/performance" element={<ProtectedRoute requireRole="member"><Performance /></ProtectedRoute>} />
          <Route path="/member/settings" element={<ProtectedRoute requireRole="member"><Settings /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

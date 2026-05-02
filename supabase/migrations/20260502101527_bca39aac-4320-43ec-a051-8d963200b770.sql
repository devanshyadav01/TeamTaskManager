
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.task_status AS ENUM ('pending', 'accepted', 'rejected', 'in_progress', 'in_review', 'completed');
CREATE TYPE public.assignee_type AS ENUM ('user', 'team', 'designation');
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'Users',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DESIGNATIONS (sub-roles inside teams)
-- ============================================================
CREATE TABLE public.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, name)
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- USER ROLES (separate table — security best practice)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_team(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_user_designation(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT designation_id FROM public.profiles WHERE id = _user_id
$$;

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'active',
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_type assignee_type NOT NULL,
  assignee_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  assignee_designation_id UUID REFERENCES public.designations(id) ON DELETE CASCADE,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejection_reason TEXT,
  dependencies UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assignee_user ON public.tasks(assignee_user_id);
CREATE INDEX idx_tasks_assignee_team ON public.tasks(assignee_team_id);
CREATE INDEX idx_tasks_assignee_designation ON public.tasks(assignee_designation_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TASK ACTIVITY LOG
-- ============================================================
CREATE TABLE public.task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + member role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'member'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update_all" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TEAMS
CREATE POLICY "teams_read_all" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_admin_manage" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DESIGNATIONS
CREATE POLICY "designations_read_all" ON public.designations FOR SELECT TO authenticated USING (true);
CREATE POLICY "designations_admin_manage" ON public.designations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROJECTS
CREATE POLICY "projects_read_all" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_admin_manage" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TASKS
CREATE POLICY "tasks_admin_all" ON public.tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "tasks_member_read" ON public.tasks FOR SELECT TO authenticated USING (
  assignee_user_id = auth.uid()
  OR assignee_team_id = public.get_user_team(auth.uid())
  OR assignee_designation_id = public.get_user_designation(auth.uid())
);

CREATE POLICY "tasks_member_update" ON public.tasks FOR UPDATE TO authenticated USING (
  assignee_user_id = auth.uid()
  OR assignee_team_id = public.get_user_team(auth.uid())
  OR assignee_designation_id = public.get_user_designation(auth.uid())
);

-- TASK COMMENTS
CREATE POLICY "comments_read" ON public.task_comments FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (
      t.assignee_user_id = auth.uid()
      OR t.assignee_team_id = public.get_user_team(auth.uid())
      OR t.assignee_designation_id = public.get_user_designation(auth.uid())
      OR t.created_by = auth.uid()
    )
  )
);
CREATE POLICY "comments_insert" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- TASK ACTIVITY LOG
CREATE POLICY "activity_read" ON public.task_activity_log FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (
      t.assignee_user_id = auth.uid()
      OR t.assignee_team_id = public.get_user_team(auth.uid())
      OR t.assignee_designation_id = public.get_user_designation(auth.uid())
    )
  )
);
CREATE POLICY "activity_insert" ON public.task_activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "messages_read_own" ON public.messages FOR SELECT TO authenticated USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_authed" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_comments REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- ============================================================
-- SEED TEAMS + DESIGNATIONS
-- ============================================================
INSERT INTO public.teams (name, description, color, icon) VALUES
  ('Management', 'Leadership and operations', '#6366f1', 'Briefcase'),
  ('IT', 'Engineering and infrastructure', '#3b82f6', 'Code2'),
  ('Marketing', 'Brand, growth, and content', '#ec4899', 'Megaphone'),
  ('Design', 'Product and brand design', '#a855f7', 'Palette'),
  ('Operations', 'Day-to-day execution', '#10b981', 'Settings');

INSERT INTO public.designations (team_id, name)
SELECT id, d.name FROM public.teams t, (VALUES
  ('Management', 'Project Manager'),
  ('Management', 'Team Lead'),
  ('Management', 'Operations Manager'),
  ('IT', 'Web Developer'),
  ('IT', 'Mobile Developer'),
  ('IT', 'AI Developer'),
  ('IT', 'Backend Engineer'),
  ('IT', 'DevOps Engineer'),
  ('IT', 'QA Engineer'),
  ('Marketing', 'Content Writer'),
  ('Marketing', 'SEO Specialist'),
  ('Marketing', 'Social Media Manager'),
  ('Marketing', 'Marketing Analyst'),
  ('Design', 'UI Designer'),
  ('Design', 'UX Designer'),
  ('Design', 'Brand Designer'),
  ('Operations', 'Operations Analyst'),
  ('Operations', 'Customer Success')
) AS d(team_name, name)
WHERE t.name = d.team_name;

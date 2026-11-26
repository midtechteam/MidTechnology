-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- profiles: users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- workspaces: owners and members can read
CREATE POLICY "Workspace owners can do all" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Workspace members can read" ON public.workspaces FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = id AND user_id = auth.uid())
);

-- workspace_members
CREATE POLICY "Members can view their memberships" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Workspace owners can manage members" ON public.workspace_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

-- projects: owners can CRUD, workspace members can read if workspace_id matches
CREATE POLICY "Project owners can do all" ON public.projects FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Workspace members can view workspace projects" ON public.projects FOR SELECT USING (
  workspace_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = projects.workspace_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view shared projects" ON public.projects FOR SELECT USING (is_shared = TRUE AND deleted_at IS NULL);

-- project_pages
CREATE POLICY "Project page access follows project" ON public.project_pages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- project_revisions
CREATE POLICY "Revision access follows project" ON public.project_revisions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- components
CREATE POLICY "Users can CRUD own components" ON public.components FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Public components readable by all" ON public.components FOR SELECT USING (is_public = TRUE);

-- assets
CREATE POLICY "Users can CRUD own assets" ON public.assets FOR ALL USING (owner_id = auth.uid());

-- export_jobs
CREATE POLICY "Users can CRUD own export jobs" ON public.export_jobs FOR ALL USING (created_by = auth.uid());

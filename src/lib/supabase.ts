import { createClient } from "@supabase/supabase-js";

// ─── Environment variables ───────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

// ─── Database type definitions ───────────────────────────────────────────────
export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  invited_at: string;
  joined_at: string | null;
}

export interface Project {
  id: string;
  workspace_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectPage {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRevision {
  id: string;
  project_id: string;
  author_id: string;
  document: Record<string, unknown>;
  message: string | null;
  created_at: string;
}

export interface Component {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description: string | null;
  category: string | null;
  definition: Record<string, unknown>;
  version: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      workspaces: { Row: Workspace; Insert: Partial<Workspace>; Update: Partial<Workspace> };
      workspace_members: { Row: WorkspaceMember; Insert: Partial<WorkspaceMember>; Update: Partial<WorkspaceMember> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      project_pages: { Row: ProjectPage; Insert: Partial<ProjectPage>; Update: Partial<ProjectPage> };
      project_revisions: { Row: ProjectRevision; Insert: Partial<ProjectRevision>; Update: Partial<ProjectRevision> };
      components: { Row: Component; Insert: Partial<Component>; Update: Partial<Component> };
      assets: { Row: Asset; Insert: Partial<Asset>; Update: Partial<Asset> };
    };
  };
}

// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Returns the currently authenticated user, or null. */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/** Returns the profile row for the currently authenticated user. */
export async function getUserProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

/** Sign in with email and password. */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign up with email, password, and display name. */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

/** Sign out the current user. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Send a password-reset email. */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
}

/** Update the current user's profile row. */
export async function updateProfile(updates: Partial<Omit<Profile, "id" | "user_id" | "created_at">>) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await (supabase
    .from("profiles") as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get latest saved document snapshot */
export async function getLatestDocument(projectId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { data: null, error: null };
    }

    const { data, error } = await (supabase
      .from('project_revisions') as any)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/** Save document revision to database */
export async function saveProjectDocument(
  projectId: string,
  userId: string,
  document: Record<string, unknown>,
  isAutosave = false
) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { data: null, error: null };
    }

    const { data, error } = await (supabase
      .from('project_revisions') as any)
      .insert({
        project_id: projectId,
        created_by: userId,
        document,
        is_autosave: isAutosave,
        summary: isAutosave ? 'Autosave' : 'Manual save',
      });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

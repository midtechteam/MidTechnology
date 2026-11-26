import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  thumbnail: string | null;
  updatedAt: string;
  createdAt: string;
  pageCount: number;
}

type SortBy = 'updated' | 'created' | 'name';

interface ProjectState {
  projects: ProjectSummary[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: SortBy;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  createProject: (name: string, category?: string) => Promise<{ id: string | null; error: Error | null }>;
  deleteProject: (id: string) => Promise<{ error: Error | null }>;
  duplicateProject: (id: string) => Promise<{ id: string | null; error: Error | null }>;
  renameProject: (id: string, name: string) => Promise<{ error: Error | null }>;
  setSearch: (q: string) => void;
  setSort: (by: SortBy) => void;
  restoreFromTrash: (id: string) => Promise<{ error: Error | null }>;
  recentProjects: () => ProjectSummary[];
}

type ProjectStore = ProjectState & ProjectActions;

// ── Helper: map raw DB row → ProjectSummary ────────────────────────────────

function mapRow(row: Record<string, unknown>): ProjectSummary {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    category: (row.category as string) ?? null,
    thumbnail: (row.thumbnail_url as string) ?? null,
    updatedAt: row.updated_at as string,
    createdAt: row.created_at as string,
    pageCount: (row.page_count as number) ?? 0,
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // ── State (seeded with projects matching reference design) ──────────────
  projects: [
    {
      id: 'demo-tripo',
      name: 'TripO Website',
      description: 'Travel booking platform wireframe',
      category: 'website',
      thumbnail: null,
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
      pageCount: 3,
    },
    {
      id: 'demo-kumaran',
      name: 'Kumaran Elite',
      description: 'Real estate modern luxury portal',
      category: 'website',
      thumbnail: null,
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
      pageCount: 2,
    },
    {
      id: 'demo-scafbind-landing',
      name: 'Scafbind Landing',
      description: 'Official SaaS wireframe landing layout',
      category: 'website',
      thumbnail: null,
      updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
      pageCount: 4,
    },
    {
      id: 'demo-travel-app',
      name: 'Travel App',
      description: 'iOS travel mobile app flows',
      category: 'mobile',
      thumbnail: null,
      updatedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
      pageCount: 5,
    },
  ],
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: 'updated',

  // ── fetchProjects ────────────────────────────────────────────────────────
  fetchProjects: async () => {
    set({ loading: true, error: null });

    const { sortBy, searchQuery } = get();

    let query = (supabase
      .from('projects') as any)
      .select('id, name, description, category, thumbnail_url, updated_at, created_at, page_count')
      .is('deleted_at', null); // soft-delete guard

    if (searchQuery.trim()) {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }

    if (sortBy === 'updated') query = query.order('updated_at', { ascending: false });
    else if (sortBy === 'created') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'name') query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ projects: (data ?? []).map(mapRow), loading: false });
  },

  // ── recentProjects ───────────────────────────────────────────────────────
  recentProjects: () => {
    return get().projects.slice(0, 8);
  },

  // ── createProject ────────────────────────────────────────────────────────
  createProject: async (name, category) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await (supabase
          .from('projects') as any)
          .insert({ name, category: category ?? null, owner_id: user.id, page_count: 1 })
          .select('id, name, description, category, thumbnail_url, updated_at, created_at, page_count')
          .single();

        if (data && !error) {
          const newProject = mapRow(data as Record<string, unknown>);
          set((s) => ({ projects: [newProject, ...s.projects] }));
          return { id: newProject.id, error: null };
        }
      }
    } catch (e) {
      // Offline fallback
    }

    // Local in-memory / offline fallback
    const localId = `proj-${Date.now()}`;
    const localProject: ProjectSummary = {
      id: localId,
      name,
      description: null,
      category: category ?? 'website',
      thumbnail: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      pageCount: 1,
    };
    set((s) => ({ projects: [localProject, ...s.projects] }));
    return { id: localProject.id, error: null };
  },

  // ── deleteProject ────────────────────────────────────────────────────────
  deleteProject: async (id) => {
    // Soft delete via deleted_at timestamp
    const { error } = await (supabase
      .from('projects') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { error: new Error(error.message) };
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    return { error: null };
  },

  // ── duplicateProject ─────────────────────────────────────────────────────
  duplicateProject: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, error: new Error('Not authenticated') };

    // Fetch original
    const { data: original, error: fetchErr } = await (supabase
      .from('projects') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !original) return { id: null, error: new Error(fetchErr?.message ?? 'Not found') };

    const { data, error } = await (supabase
      .from('projects') as any)
      .insert({
        name: `${original.name} Copy`,
        description: original.description,
        category: original.category,
        owner_id: user.id,
        page_count: original.page_count ?? 0,
      })
      .select('id, name, description, category, thumbnail_url, updated_at, created_at, page_count')
      .single();

    if (error || !data) return { id: null, error: error ? new Error(error.message) : new Error('Unknown error') };

    const dupe = mapRow(data as Record<string, unknown>);
    set((s) => ({ projects: [dupe, ...s.projects] }));
    return { id: dupe.id, error: null };
  },

  // ── renameProject ────────────────────────────────────────────────────────
  renameProject: async (id, name) => {
    const { error } = await (supabase
      .from('projects') as any)
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { error: new Error(error.message) };
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
      ),
    }));
    return { error: null };
  },

  // ── setSearch ────────────────────────────────────────────────────────────
  setSearch: (q) => set({ searchQuery: q }),

  // ── setSort ──────────────────────────────────────────────────────────────
  setSort: (by) => set({ sortBy: by }),

  // ── restoreFromTrash ──────────────────────────────────────────────────────
  restoreFromTrash: async (id) => {
    const { error } = await (supabase
      .from('projects') as any)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) return { error: new Error(error.message) };

    // Re-fetch to get updated project back into state
    const { data } = await (supabase
      .from('projects') as any)
      .select('id, name, description, category, thumbnail_url, updated_at, created_at, page_count')
      .eq('id', id)
      .single();

    if (data) {
      const restored = mapRow(data as Record<string, unknown>);
      set((s) => ({ projects: [restored, ...s.projects.filter((p) => p.id !== id)] }));
    }

    return { error: null };
  },
}));

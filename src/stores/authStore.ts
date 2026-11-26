import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: 'free' | 'pro';
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id'>>) => Promise<{ error: Error | null }>;
}

type AuthStore = AuthState & AuthActions;

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, plan')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  // ── Setters ──────────────────────────────────────────────────────────────
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  // ── initialize ───────────────────────────────────────────────────────────
  initialize: async () => {
    set({ loading: true });

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    const profile = user ? await fetchProfile(user.id) : null;

    set({ user, profile, initialized: true, loading: false });

    // Keep state in sync via onAuthStateChange
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      const nextProfile = nextUser ? await fetchProfile(nextUser.id) : null;
      set({ user: nextUser, profile: nextProfile });
    });
  },

  // ── signIn ───────────────────────────────────────────────────────────────
  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      return { error };
    }
    const profile = data.user ? await fetchProfile(data.user.id) : null;
    set({ user: data.user, profile, loading: false });
    return { error: null };
  },

  // ── signUp ───────────────────────────────────────────────────────────────
  signUp: async (email, password, name) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      set({ loading: false });
      return { error };
    }
    // Profile row is typically created by a DB trigger; attempt fetch anyway
    const profile = data.user ? await fetchProfile(data.user.id) : null;
    set({ user: data.user ?? null, profile, loading: false });
    return { error: null };
  },

  // ── loginAsDemo ─────────────────────────────────────────────────────────
  loginAsDemo: () => {
    const demoUser = {
      id: 'demo-user-elumugam',
      email: 'elumugam@scafbind.com',
      user_metadata: { name: 'Elumugam' },
    } as any;
    const demoProfile: UserProfile = {
      id: 'demo-user-elumugam',
      name: 'Elumugam',
      email: 'elumugam@scafbind.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face',
      plan: 'pro',
    };
    set({ user: demoUser, profile: demoProfile, initialized: true, loading: false });
  },

  // ── signOut ──────────────────────────────────────────────────────────────
  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },

  // ── updateProfile ────────────────────────────────────────────────────────
  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return { error: new Error('Not authenticated') };

    const { error } = await (supabase
      .from('profiles') as any)
      .update(updates)
      .eq('id', profile.id);

    if (error) return { error };
    set({ profile: { ...profile, ...updates } });
    return { error: null };
  },
}));

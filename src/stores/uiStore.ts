import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

export type LeftPanelTab = 'tools' | 'layers' | 'components' | 'assets';

// ── State & Actions ────────────────────────────────────────────────────────

interface UIState {
  workspace: string;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  rightPanelOpen: boolean;
  leftPanelTab: LeftPanelTab;
  mobileDrawerOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
}

interface UIActions {
  setWorkspace: (workspace: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  setMobileDrawer: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  /** Convenience helper: creates a toast and auto-removes it after duration. */
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

type UIStore = UIState & UIActions;

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_DURATION = 4000;

// ── Store ──────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  workspace: 'Personal',
  sidebarCollapsed: false,
  sidebarWidth: 240,
  rightPanelOpen: true,
  leftPanelTab: 'tools',
  mobileDrawerOpen: false,
  activeModal: null,
  toasts: [],

  // ── Workspace ────────────────────────────────────────────────────────────
  setWorkspace: (workspace: string) => set({ workspace }),

  // ── Sidebar ───────────────────────────────────────────────────────────────
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(160, Math.min(480, width)) }),

  // ── Right panel ───────────────────────────────────────────────────────────
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

  // ── Left panel tab ────────────────────────────────────────────────────────
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),

  // ── Mobile drawer ─────────────────────────────────────────────────────────
  setMobileDrawer: (open) => set({ mobileDrawerOpen: open }),

  // ── Modals ────────────────────────────────────────────────────────────────
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // ── Toasts ────────────────────────────────────────────────────────────────
  addToast: (toast) => set((s) => ({ toasts: [...s.toasts, toast] })),

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  showToast: (toast) => {
    const id = generateId();
    const duration = toast.duration ?? DEFAULT_DURATION;
    const full: Toast = { ...toast, id, duration };

    get().addToast(full);

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
}));

// ── Convenience selectors ──────────────────────────────────────────────────

/** Returns true when any modal is open. */
export const selectIsModalOpen = (s: UIStore): boolean => s.activeModal !== null;

/** Returns sidebar effective width (0 when collapsed). */
export const selectEffectiveSidebarWidth = (s: UIStore): number =>
  s.sidebarCollapsed ? 0 : s.sidebarWidth;

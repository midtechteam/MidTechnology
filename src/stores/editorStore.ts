import { create } from 'zustand';
import type {
  ScafbindDocument,
  Element,
  Artboard,
  DocumentSnapshot,
  ArtboardPreset,
} from '../types/document';
import { createEmptyDocument } from '../types/document';
import type { ToolType } from '../types';
import { saveDocument as idbSaveDocument, getDocument as idbGetDocument } from '../lib/indexdb';
import { saveProjectDocument, getLatestDocument } from '../lib/supabase';
import { downloadSVG } from '../lib/exporters/imageExporter';
import { exportToHTML, exportToReact } from '../lib/exporters/codeExporter';
import { exportToPromptTXT, exportToPromptMD } from '../lib/exporters/promptExporter';
import { downloadText } from '../lib/utils';

const MAX_UNDO = 50;

// ── Helpers ────────────────────────────────────────────────────────────────

function snapshot(document: ScafbindDocument): DocumentSnapshot {
  return JSON.parse(JSON.stringify(document));
}

function pushUndo(undoStack: DocumentSnapshot[], doc: ScafbindDocument): DocumentSnapshot[] {
  const next = [...undoStack, snapshot(doc)];
  return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── State & Actions types ──────────────────────────────────────────────────

interface EditorState {
  document: ScafbindDocument | null;
  projectName: string;
  activePageId: string | null;
  activeArtboardId: string | null;
  selectedElementIds: string[];
  activeTool: ToolType;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undoStack: DocumentSnapshot[];
  redoStack: DocumentSnapshot[];
  clipboard: Element[] | null;
  hoveredElementId: string | null;
  userAvatar: string;
}

interface EditorActions {
  // View
  loadDocument: (doc: ScafbindDocument) => void;
  loadProject: (projectId: string) => Promise<void>;
  saveToIndexedDB: () => Promise<void>;
  saveToSupabase: () => Promise<void>;
  setProjectName: (name: string) => void;
  fitScreen: (viewportWidth?: number, viewportHeight?: number) => void;
  exportAs: (format: string) => void;
  setActivePage: (pageId: string) => void;
  setActiveArtboard: (artboardId: string) => void;
  setSelectedElements: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnap: () => void;
  setSaveStatus: (status: EditorState['saveStatus']) => void;
  setHoveredElement: (id: string | null) => void;

  // Document mutations
  addElement: (element: Element, artboardId?: string) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElements: (ids: string[]) => void;
  deleteSelected: () => void;
  moveElements: (ids: string[], dx: number, dy: number) => void;
  resizeElement: (id: string, x: number, y: number, width: number, height: number) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;
  groupElements: (ids: string[]) => void;
  ungroupElements: (groupId: string) => void;
  duplicateElements: (ids: string[]) => void;
  duplicateSelected: () => void;

  // Page actions
  addPage: (name: string) => void;
  renamePage: (id: string, name: string) => void;
  deletePage: (id: string) => void;
  resetPage: (id: string) => void;
  duplicatePage: (id: string) => void;

  // Artboard actions
  addArtboard: (preset: ArtboardPreset, pageId?: string) => void;
  updateArtboard: (id: string, updates: Partial<Artboard>) => void;
  renameArtboard: (id: string, name: string) => void;
  deleteArtboard: (id: string) => void;
  duplicateArtboard: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Clipboard
  copyElements: (ids: string[]) => void;
  copySelected: () => void;
  pasteElements: () => void;

  // Section splitter
  setSectionSplitter: (
    artboardId: string,
    splitDirection: 'horizontal' | 'vertical',
    sections: number
  ) => void;
}

type EditorStore = EditorState & EditorActions;

// ── Store ──────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  document: null,
  projectName: 'Untitled Wireframe',
  activePageId: null,
  activeArtboardId: null,
  selectedElementIds: [],
  activeTool: 'select',
  zoom: 1.0,
  panX: 0,
  panY: 0,
  showGrid: true,
  showRulers: false,
  snapToGrid: true,
  gridSize: 8,
  saveStatus: 'saved',
  isDirty: false,
  canUndo: false,
  canRedo: false,
  undoStack: [],
  redoStack: [],
  clipboard: null,
  hoveredElementId: null,
  userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face',

  // ── View actions ─────────────────────────────────────────────────────────
  setProjectName: (name) => {
    const { document } = get();
    if (document) {
      set({
        projectName: name,
        document: { ...document, meta: { ...document.meta, name } },
        isDirty: true,
        saveStatus: 'unsaved',
      });
    } else {
      set({ projectName: name });
    }
  },

  fitScreen: (vpWidth?: number, vpHeight?: number) => {
    const { document, activeArtboardId, activePageId } = get();
    if (!document) {
      set({ zoom: 1.0, panX: 40, panY: 40 });
      return;
    }
    const page = document.pages.find((p) => p.id === activePageId) || document.pages[0];
    const artboard = page?.artboards.find((ab) => ab.id === activeArtboardId) || page?.artboards[0];
    if (!artboard) {
      set({ zoom: 1.0, panX: 40, panY: 40 });
      return;
    }

    const vw = vpWidth || (typeof window !== 'undefined' ? window.innerWidth - 320 : 1100);
    const vh = vpHeight || (typeof window !== 'undefined' ? window.innerHeight - 100 : 750);

    const availableW = Math.max(300, vw - 60);
    const availableH = Math.max(300, vh - 60);

    const scale = Math.min(availableW / artboard.width, availableH / artboard.height, 1.0);
    const clampedScale = Math.max(0.1, Math.min(2.0, Number(scale.toFixed(2))));

    const panX = (vw - artboard.width * clampedScale) / 2;
    const panY = (vh - artboard.height * clampedScale) / 2;

    set({ zoom: clampedScale, panX: Math.round(panX), panY: Math.round(panY) });
  },

  loadProject: async (projectId: string) => {
    set({ saveStatus: 'saving' });
    try {
      // 1. Try IndexedDB first
      const localDoc = (await idbGetDocument(projectId)) as ScafbindDocument | null;
      if (localDoc) {
        get().loadDocument(localDoc);
        set({ projectName: localDoc.meta.name });
        return;
      }

      // 2. Try Supabase
      try {
        const { data, error } = await getLatestDocument(projectId);
        if (!error && data && data.document) {
          const doc = data.document as ScafbindDocument;
          get().loadDocument(doc);
          set({ projectName: doc.meta.name });
          return;
        }
      } catch (sbErr) {
        // Fallback to local
      }

      // 3. Fallback: generate default document
      const fallback = createEmptyDocument('New Wireframe', 'website');
      fallback.meta.id = projectId;
      get().loadDocument(fallback);
      set({ projectName: fallback.meta.name });
    } catch (err) {
      console.warn('Could not load project, initializing empty document:', err);
      const fallback = createEmptyDocument('New Wireframe', 'website');
      fallback.meta.id = projectId;
      get().loadDocument(fallback);
      set({ projectName: fallback.meta.name });
    }
  },

  saveToIndexedDB: async () => {
    const { document } = get();
    if (!document) return;
    await idbSaveDocument(document.meta.id, document);
    set({ isDirty: false, saveStatus: 'saved' });
  },

  saveToSupabase: async () => {
    const { document } = get();
    if (!document) return;
    try {
      const res = await saveProjectDocument(document.meta.id, document.meta.ownerId || 'anon', document as any, true);
      if (res && !res.error) {
        set({ isDirty: false, saveStatus: 'saved' });
      }
    } catch (e) {
      // Offline fallback
      console.warn('Supabase sync skipped (offline or not authenticated)');
    }
  },

  exportAs: (format: string) => {
    const { document, activeArtboardId } = get();
    if (!document) return;

    switch (format.toLowerCase()) {
      case 'svg':
        downloadSVG(document, `${document.meta.name || 'wireframe'}.svg`);
        break;
      case 'html': {
        const html = exportToHTML(document, activeArtboardId || undefined);
        downloadText(html, `${document.meta.name || 'wireframe'}.html`, 'text/html');
        break;
      }
      case 'react': {
        const reactCode = exportToReact(document, activeArtboardId || undefined);
        downloadText(reactCode, `${document.meta.name || 'Wireframe'}.tsx`, 'text/typescript');
        break;
      }
      case 'prompt':
      case 'prompt-txt': {
        const txt = exportToPromptTXT(document);
        downloadText(txt, `${document.meta.name || 'wireframe'}-spec.txt`, 'text/plain');
        break;
      }
      case 'prompt-md': {
        const md = exportToPromptMD(document);
        downloadText(md, `${document.meta.name || 'wireframe'}-spec.md`, 'text/markdown');
        break;
      }
      case 'png':
      default: {
        // SVG fallback if stage not directly attached
        downloadSVG(document, `${document.meta.name || 'wireframe'}.svg`);
        break;
      }
    }
  },

  copySelected: () => {
    const { selectedElementIds, copyElements } = get();
    if (selectedElementIds.length) copyElements(selectedElementIds);
  },

  duplicateSelected: () => {
    const { selectedElementIds, duplicateElements } = get();
    if (selectedElementIds.length) duplicateElements(selectedElementIds);
  },

  deleteSelected: () => {
    const { selectedElementIds, deleteElements } = get();
    if (selectedElementIds.length) deleteElements(selectedElementIds);
  },

  loadDocument: (doc) =>
    set({
      document: doc,
      projectName: doc.meta?.name || 'Untitled Wireframe',
      activePageId: doc.pages?.[0]?.id ?? null,
      activeArtboardId: doc.pages?.[0]?.artboards?.[0]?.id ?? null,
      selectedElementIds: [],
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      isDirty: false,
      saveStatus: 'saved',
    }),

  setActivePage: (pageId) => {
    const { document } = get();
    const page = document?.pages.find((p) => p.id === pageId);
    const firstArtboard = page?.artboards[0];
    set({
      activePageId: pageId,
      activeArtboardId: firstArtboard?.id ?? null,
      selectedElementIds: [],
    });
  },
  setActiveArtboard: (artboardId) => set({ activeArtboardId: artboardId, selectedElementIds: [] }),
  setSelectedElements: (ids) => set({ selectedElementIds: ids }),
  addToSelection: (id) =>
    set((s) => ({ selectedElementIds: s.selectedElementIds.includes(id) ? s.selectedElementIds : [...s.selectedElementIds, id] })),
  removeFromSelection: (id) =>
    set((s) => ({ selectedElementIds: s.selectedElementIds.filter((x) => x !== id) })),
  clearSelection: () => set({ selectedElementIds: [] }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.05, Math.min(4.0, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setHoveredElement: (id) => set({ hoveredElementId: id }),

  // ── Internal helper: mutate document with undo ───────────────────────────
  // (used by all document mutation actions below)

  // ── addElement ───────────────────────────────────────────────────────────
  addElement: (element, artboardId) => {
    const { document, activeArtboardId, activePageId, undoStack } = get();
    if (!document) return;
    const page = document.pages.find((p) => p.id === activePageId) || document.pages[0];
    const targetArtboardId = artboardId ?? activeArtboardId ?? page?.artboards[0]?.id;
    if (!targetArtboardId) return;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((p) => ({
        ...p,
        artboards: p.artboards.map((ab) =>
          ab.id === targetArtboardId
            ? { ...ab, elements: [...ab.elements, element] }
            : ab
        ),
      })),
    };
    set({
      document: newDoc,
      activeArtboardId: targetArtboardId,
      selectedElementIds: [element.id],
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── updateElement ────────────────────────────────────────────────────────
  updateElement: (id, updates) => {
    const { document, undoStack } = get();
    if (!document) return;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => ({
          ...ab,
          elements: ab.elements.map((el) => (el.id === id ? ({ ...el, ...updates } as any) : el)),
        })),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── deleteElements ───────────────────────────────────────────────────────
  deleteElements: (ids) => {
    const { document, undoStack } = get();
    if (!document) return;
    const idSet = new Set(ids);

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => ({
          ...ab,
          elements: ab.elements.filter((el) => !idSet.has(el.id)),
        })),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      selectedElementIds: get().selectedElementIds.filter((id) => !idSet.has(id)),
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── moveElements ─────────────────────────────────────────────────────────
  moveElements: (ids, dx, dy) => {
    const { document, undoStack } = get();
    if (!document) return;
    const idSet = new Set(ids);

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => ({
          ...ab,
          elements: ab.elements.map((el) =>
            idSet.has(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
          ),
        })),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── resizeElement ─────────────────────────────────────────────────────────
  resizeElement: (id, x, y, width, height) => {
    const { document, undoStack } = get();
    if (!document) return;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => ({
          ...ab,
          elements: ab.elements.map((el) =>
            el.id === id ? { ...el, x, y, width, height } : el
          ),
        })),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── reorderElement ────────────────────────────────────────────────────────
  reorderElement: (id, direction) => {
    const { document, undoStack } = get();
    if (!document) return;

    const reorder = (elements: Element[]): Element[] => {
      const idx = elements.findIndex((el) => el.id === id);
      if (idx < 0) return elements;
      const arr = [...elements];
      const [item] = arr.splice(idx, 1);
      if (direction === 'up' && idx > 0) arr.splice(idx - 1, 0, item);
      else if (direction === 'down' && idx < arr.length) arr.splice(idx + 1, 0, item);
      else if (direction === 'front') arr.push(item);
      else if (direction === 'back') arr.unshift(item);
      else arr.splice(idx, 0, item);
      return arr;
    };

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => ({
          ...ab,
          elements: reorder(ab.elements),
        })),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── groupElements ─────────────────────────────────────────────────────────
  groupElements: (ids) => {
    const { document, undoStack } = get();
    if (!document || ids.length < 2) return;
    const idSet = new Set(ids);
    const groupId = generateId();

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => {
          const children = ab.elements.filter((el) => idSet.has(el.id));
          if (!children.length) return ab;
          const xs = children.map((el) => el.x);
          const ys = children.map((el) => el.y);
          const x2s = children.map((el) => el.x + (el.width ?? 0));
          const y2s = children.map((el) => el.y + (el.height ?? 0));
          const gx = Math.min(...xs);
          const gy = Math.min(...ys);
          const gw = Math.max(...x2s) - gx;
          const gh = Math.max(...y2s) - gy;

          const groupElement: Element = {
            id: groupId,
            type: 'group',
            x: gx,
            y: gy,
            width: gw,
            height: gh,
            children: children.map((el) => ({ ...el, x: el.x - gx, y: el.y - gy })),
          } as unknown as Element;

          return {
            ...ab,
            elements: [
              ...ab.elements.filter((el) => !idSet.has(el.id)),
              groupElement,
            ],
          };
        }),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      selectedElementIds: [groupId],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── ungroupElements ───────────────────────────────────────────────────────
  ungroupElements: (groupId) => {
    const { document, undoStack } = get();
    if (!document) return;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => {
          const group = ab.elements.find((el) => el.id === groupId);
          if (!group || group.type !== 'group') return ab;
          const ungrouped = ((group as any).children ?? []).map((child: Element) => ({
            ...child,
            x: group.x + child.x,
            y: group.y + child.y,
          }));
          return {
            ...ab,
            elements: [
              ...ab.elements.filter((el) => el.id !== groupId),
              ...ungrouped,
            ],
          };
        }),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── duplicateElements ─────────────────────────────────────────────────────
  duplicateElements: (ids) => {
    const { document, undoStack } = get();
    if (!document) return;
    const idSet = new Set(ids);

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) => {
          const dupes = ab.elements
            .filter((el) => idSet.has(el.id))
            .map((el) => ({ ...el, id: generateId(), x: el.x + 16, y: el.y + 16 }));
          return { ...ab, elements: [...ab.elements, ...dupes] };
        }),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── Page actions ──────────────────────────────────────────────────────────
  addPage: (name) => {
    const { document, undoStack } = get();
    if (!document) return;
    const refArtboard = document.pages[0]?.artboards[0];
    const width = refArtboard?.width || 1440;
    const height = refArtboard?.height || 900;

    // Calculate sensible non-overlapping position relative to existing artboards
    const existingArtboards = document.pages.flatMap((p) => p.artboards);
    let newX = 80;
    let newY = 80;
    if (existingArtboards.length > 0) {
      const maxX = Math.max(...existingArtboards.map((ab) => ab.x + (ab.width || 1440)));
      newX = maxX + 80;
      const lastAb = existingArtboards[existingArtboards.length - 1];
      newY = lastAb?.y ?? 80;
    }

    const newArtboard: Artboard = {
      id: generateId(),
      name: `${name} Screen`,
      x: newX,
      y: newY,
      width,
      height,
      background: '#FFFFFF',
      elements: [],
      isLocked: false,
    };
    const newPage = { id: generateId(), name, artboards: [newArtboard] };
    const newDoc = { ...document, pages: [...document.pages, newPage] };
    set({
      document: newDoc,
      activePageId: newPage.id,
      activeArtboardId: newArtboard.id,
      selectedElementIds: [],
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  renamePage: (id, name) => {
    const { document, undoStack } = get();
    if (!document) return;
    const newDoc = {
      ...document,
      pages: document.pages.map((p) => {
        if (p.id !== id) return p;
        const updatedArtboards = p.artboards.map((ab, idx) =>
          idx === 0 ? { ...ab, name: `${name} Screen` } : ab
        );
        return { ...p, name, artboards: updatedArtboards };
      }),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  deletePage: (id) => {
    const { document, undoStack, activePageId } = get();
    if (!document || document.pages.length <= 1) return;
    const newPages = document.pages.filter((p) => p.id !== id);
    const newActivePageId = activePageId === id ? (newPages[0]?.id ?? null) : activePageId;
    const newActivePage = newPages.find((p) => p.id === newActivePageId);
    const newDoc = { ...document, pages: newPages };
    set({
      document: newDoc,
      activePageId: newActivePageId,
      activeArtboardId: newActivePage?.artboards[0]?.id ?? null,
      selectedElementIds: [],
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  resetPage: (id) => {
    const { document, undoStack } = get();
    if (!document) return;
    const newDoc = {
      ...document,
      pages: document.pages.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          artboards: p.artboards.map((ab) => ({
            ...ab,
            elements: [],
          })),
        };
      }),
    };
    set({
      document: newDoc,
      selectedElementIds: [],
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  duplicatePage: (id) => {
    const { document, undoStack } = get();
    if (!document) return;
    const page = document.pages.find((p) => p.id === id);
    if (!page) return;

    const existingArtboards = document.pages.flatMap((p) => p.artboards);
    const maxX = Math.max(...existingArtboards.map((ab) => ab.x + (ab.width || 1440)), 0);
    const offset = maxX > 0 ? maxX + 80 : 80;

    const newArtboards = (page.artboards || []).map((ab) => ({
      ...ab,
      id: generateId(),
      name: `${ab.name} Copy`,
      x: offset,
      isLocked: false,
      elements: (ab.elements || []).map((el) => ({ ...el, id: generateId() })),
    }));
    const newPage = {
      ...page,
      id: generateId(),
      name: `${page.name} Copy`,
      artboards: newArtboards,
    };
    const idx = document.pages.findIndex((p) => p.id === id);
    const newPages = [...document.pages];
    newPages.splice(idx + 1, 0, newPage);
    const newDoc = { ...document, pages: newPages };
    set({
      document: newDoc,
      activePageId: newPage.id,
      activeArtboardId: newPage.artboards[0]?.id ?? null,
      selectedElementIds: [],
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── Artboard actions ──────────────────────────────────────────────────────
  addArtboard: (preset, pageId) => {
    const { document, undoStack, activePageId } = get();
    if (!document) return;
    const targetPageId = pageId ?? activePageId;
    if (!targetPageId) return;

    const existingArtboards = document.pages.flatMap((p) => p.artboards);
    let newX = 80;
    let newY = 80;
    if (existingArtboards.length > 0) {
      const maxX = Math.max(...existingArtboards.map((ab) => ab.x + (ab.width || 1440)));
      newX = maxX + 80;
      const lastAb = existingArtboards[existingArtboards.length - 1];
      newY = lastAb?.y ?? 80;
    }

    const newArtboard = {
      id: generateId(),
      name: (preset as any).label ?? (preset as any).name ?? 'Artboard',
      width: preset.width,
      height: preset.height,
      background: '#FFFFFF',
      elements: [],
      x: newX,
      y: newY,
      isLocked: false,
    };

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((p) =>
        p.id === targetPageId ? { ...p, artboards: [...p.artboards, newArtboard] } : p
      ),
    };
    set({
      document: newDoc,
      activeArtboardId: newArtboard.id,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  updateArtboard: (id, updates) => {
    const { document, undoStack } = get();
    if (!document) return;
    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((p) => ({
        ...p,
        artboards: p.artboards.map((ab) => (ab.id === id ? { ...ab, ...updates } : ab)),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  renameArtboard: (id, name) => {
    const { document, undoStack } = get();
    if (!document) return;
    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((p) => ({
        ...p,
        artboards: p.artboards.map((ab) => (ab.id === id ? { ...ab, name } : ab)),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  deleteArtboard: (id) => {
    const { document, undoStack, activeArtboardId } = get();
    if (!document) return;
    let newActiveArtboardId = activeArtboardId;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((p) => {
        const filtered = p.artboards.filter((ab) => ab.id !== id);
        if (activeArtboardId === id) newActiveArtboardId = filtered[0]?.id ?? null;
        return { ...p, artboards: filtered };
      }),
    };
    set({
      document: newDoc,
      activeArtboardId: newActiveArtboardId,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  duplicateArtboard: (id) => {
    const { document, undoStack } = get();
    if (!document) return;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((p) => {
        const idx = p.artboards.findIndex((ab) => ab.id === id);
        if (idx < 0) return p;
        const original = p.artboards[idx];
        const dupe = { ...JSON.parse(JSON.stringify(original)), id: generateId(), name: `${original.name} Copy`, x: original.x + (original.width ?? 0) + 40 };
        const artboards = [...p.artboards];
        artboards.splice(idx + 1, 0, dupe);
        return { ...p, artboards };
      }),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── History ───────────────────────────────────────────────────────────────
  undo: () => {
    const { undoStack, redoStack, document } = get();
    if (!undoStack.length || !document) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      document: JSON.parse(JSON.stringify(prev)),
      undoStack: undoStack.slice(0, -1),
      redoStack: [snapshot(document), ...redoStack],
      canUndo: undoStack.length - 1 > 0,
      canRedo: true,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  redo: () => {
    const { undoStack, redoStack, document } = get();
    if (!redoStack.length || !document) return;
    const next = redoStack[0];
    set({
      document: JSON.parse(JSON.stringify(next)),
      undoStack: [...undoStack, snapshot(document)],
      redoStack: redoStack.slice(1),
      canUndo: true,
      canRedo: redoStack.length - 1 > 0,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── Clipboard ─────────────────────────────────────────────────────────────
  copyElements: (ids) => {
    const { document } = get();
    if (!document) return;
    const idSet = new Set(ids);
    const copied: Element[] = [];
    for (const page of document.pages) {
      for (const ab of page.artboards) {
        for (const el of ab.elements) {
          if (idSet.has(el.id)) copied.push(JSON.parse(JSON.stringify(el)));
        }
      }
    }
    set({ clipboard: copied });
  },

  pasteElements: () => {
    const { clipboard, document, undoStack, activeArtboardId } = get();
    if (!clipboard || !clipboard.length || !document || !activeArtboardId) return;

    const pasted = clipboard.map((el) => ({ ...JSON.parse(JSON.stringify(el)), id: generateId(), x: el.x + 16, y: el.y + 16 }));
    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) =>
          ab.id === activeArtboardId ? { ...ab, elements: [...ab.elements, ...pasted] } : ab
        ),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      selectedElementIds: pasted.map((el) => el.id),
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  // ── Section splitter ──────────────────────────────────────────────────────
  setSectionSplitter: (artboardId, splitDirection, sections) => {
    const { document, undoStack } = get();
    if (!document) return;

    const newDoc: ScafbindDocument = {
      ...document,
      pages: document.pages.map((page) => ({
        ...page,
        artboards: page.artboards.map((ab) =>
          ab.id === artboardId
            ? { ...ab, splitDirection, sections }
            : ab
        ),
      })),
    };
    set({
      document: newDoc,
      undoStack: pushUndo(undoStack, document),
      redoStack: [],
      canUndo: true,
      canRedo: false,
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },
}));

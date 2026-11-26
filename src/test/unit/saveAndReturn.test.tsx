import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before store import
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
  saveProjectDocument: vi.fn().mockResolvedValue({ data: null, error: null }),
  getLatestDocument: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

// Mock indexdb
vi.mock("@/lib/indexdb", () => ({
  saveDocument: vi.fn().mockResolvedValue(undefined),
  getDocument: vi.fn().mockResolvedValue(null),
}));

describe("Save and Return to Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks document as saved and not dirty upon saveToIndexedDB", async () => {
    const { useEditorStore } = await import("@/stores/editorStore");
    const { createEmptyDocument } = await import("@/types/document");

    const store = useEditorStore.getState();
    const doc = createEmptyDocument("Save Test", "website");
    store.loadDocument(doc);

    // Make document dirty by adding an element
    store.addElement({
      id: "el-1",
      type: "rect",
      name: "Rectangle",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 100,
      visible: true,
      locked: false,
      parentId: null,
      layoutDirection: "none",
    });

    expect(useEditorStore.getState().isDirty).toBe(true);
    expect(useEditorStore.getState().saveStatus).toBe("unsaved");

    // Execute save
    await useEditorStore.getState().saveToIndexedDB();

    // Verify document is now saved and not dirty
    expect(useEditorStore.getState().isDirty).toBe(false);
    expect(useEditorStore.getState().saveStatus).toBe("saved");
  });

  it("preserves changes and handles save failure cleanly without clearing dirty state", async () => {
    const { useEditorStore } = await import("@/stores/editorStore");
    const { createEmptyDocument } = await import("@/types/document");
    const { saveDocument } = await import("@/lib/indexdb");

    // Simulate save failure
    (saveDocument as any).mockRejectedValueOnce(new Error("Disk quota exceeded"));

    const store = useEditorStore.getState();
    const doc = createEmptyDocument("Fail Test", "website");
    store.loadDocument(doc);

    // Make dirty
    store.addElement({
      id: "el-fail",
      type: "rect",
      name: "Rectangle",
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 100,
      visible: true,
      locked: false,
      parentId: null,
      layoutDirection: "none",
    });

    expect(useEditorStore.getState().isDirty).toBe(true);

    // Attempt save which fails
    await expect(useEditorStore.getState().saveToIndexedDB()).rejects.toThrow("Disk quota exceeded");

    // Changes must be preserved in state and document remains dirty
    expect(useEditorStore.getState().isDirty).toBe(true);
    const elements = useEditorStore.getState().document?.pages[0].artboards[0].elements;
    expect(elements?.some((el) => el.id === "el-fail")).toBe(true);
  });
});

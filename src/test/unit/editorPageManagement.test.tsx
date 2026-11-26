import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PageOptionsMenu } from "@/pages/editor/canvas/PageOptionsMenu";

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
}));

describe("Editor Page Management", () => {
  describe("Page Lock & Positioning State", () => {
    it("manages independent page lock state and allows updating position", async () => {
      const { useEditorStore } = await import("@/stores/editorStore");
      const { createEmptyDocument } = await import("@/types/document");

      const store = useEditorStore.getState();
      const doc = createEmptyDocument("Multi-Page Test", "website");
      store.loadDocument(doc);

      // Initially 1 page, unlocked by default
      const initialPages = useEditorStore.getState().document?.pages || [];
      expect(initialPages.length).toBe(1);
      const page1 = initialPages[0];
      expect(page1.artboards[0].isLocked).toBeFalsy();

      // Add a second page
      useEditorStore.getState().addPage("Page 2");
      const pagesAfterAdd = useEditorStore.getState().document?.pages || [];
      expect(pagesAfterAdd.length).toBe(2);
      const page2 = pagesAfterAdd[1];
      expect(page2.artboards[0].isLocked).toBe(false);

      // Lock page 1 only
      useEditorStore.getState().updateArtboard(page1.artboards[0].id, { isLocked: true });

      const stateAfterLock = useEditorStore.getState();
      const updatedPage1 = stateAfterLock.document?.pages.find((p) => p.id === page1.id);
      const updatedPage2 = stateAfterLock.document?.pages.find((p) => p.id === page2.id);

      expect(updatedPage1?.artboards[0].isLocked).toBe(true);
      expect(updatedPage2?.artboards[0].isLocked).toBe(false);

      // Reposition page 2 (unlocked)
      useEditorStore.getState().updateArtboard(page2.artboards[0].id, { x: 500, y: 300 });
      const stateAfterMove = useEditorStore.getState();
      const movedPage2 = stateAfterMove.document?.pages.find((p) => p.id === page2.id);
      expect(movedPage2?.artboards[0].x).toBe(500);
      expect(movedPage2?.artboards[0].y).toBe(300);

      // Page 1 position remained unchanged
      const unmovedPage1 = stateAfterMove.document?.pages.find((p) => p.id === page1.id);
      expect(unmovedPage1?.artboards[0].x).toBe(page1.artboards[0].x);
    });
  });

  describe("Reset Page Action", () => {
    it("resets page artboards to blank elements while preserving page id, name, and position", async () => {
      const { useEditorStore } = await import("@/stores/editorStore");
      const { createEmptyDocument } = await import("@/types/document");

      const store = useEditorStore.getState();
      const doc = createEmptyDocument("Reset Test", "website");
      store.loadDocument(doc);

      const targetPage = useEditorStore.getState().document?.pages[0];
      const targetArtboardId = targetPage?.artboards[0].id!;

      // Add an element to the artboard
      useEditorStore.getState().addElement(
        {
          id: "rect-1",
          type: "rect",
          name: "Test Rect",
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          parentId: null,
          layoutDirection: "none",
        },
        targetArtboardId
      );

      const pageBeforeReset = useEditorStore.getState().document?.pages[0];
      expect(pageBeforeReset?.artboards[0].elements.length).toBe(1);
      const origX = pageBeforeReset?.artboards[0].x;
      const origY = pageBeforeReset?.artboards[0].y;
      const origName = pageBeforeReset?.name;

      // Reset the page
      useEditorStore.getState().resetPage(targetPage?.id!);

      const pageAfterReset = useEditorStore.getState().document?.pages[0];
      // Elements are emptied
      expect(pageAfterReset?.artboards[0].elements.length).toBe(0);
      // Dimensions, positioning, and page metadata are preserved
      expect(pageAfterReset?.id).toBe(targetPage?.id);
      expect(pageAfterReset?.name).toBe(origName);
      expect(pageAfterReset?.artboards[0].x).toBe(origX);
      expect(pageAfterReset?.artboards[0].y).toBe(origY);
    });
  });

  describe("Delete Page Action", () => {
    it("prevents deleting when only 1 page remains, and deletes cleanly when > 1 pages exist", async () => {
      const { useEditorStore } = await import("@/stores/editorStore");
      const { createEmptyDocument } = await import("@/types/document");

      const store = useEditorStore.getState();
      const doc = createEmptyDocument("Delete Test", "website");
      store.loadDocument(doc);

      const page1Id = useEditorStore.getState().document?.pages[0].id!;

      // Attempt to delete single remaining page
      useEditorStore.getState().deletePage(page1Id);
      expect(useEditorStore.getState().document?.pages.length).toBe(1);

      // Add a second page
      useEditorStore.getState().addPage("Page 2");
      expect(useEditorStore.getState().document?.pages.length).toBe(2);

      // Now delete page 1
      useEditorStore.getState().deletePage(page1Id);
      const pagesAfterDelete = useEditorStore.getState().document?.pages || [];
      expect(pagesAfterDelete.length).toBe(1);
      expect(pagesAfterDelete[0].name).toBe("Page 2");
    });
  });

  describe("PageOptionsMenu Component", () => {
    it("renders Reset Page and Delete Page actions with correct enabled/disabled states", () => {
      const onDelete = vi.fn();
      const onReset = vi.fn();
      const onClose = vi.fn();

      const { rerender } = render(
        <PageOptionsMenu
          x={100}
          y={100}
          pageId="page-1"
          pageName="Test Page"
          canDelete={false}
          hasElements={false}
          onDelete={onDelete}
          onReset={onReset}
          onClose={onClose}
        />
      );

      expect(screen.getByText("Test Page")).toBeDefined();
      expect(screen.getByText("Reset Page")).toBeDefined();
      expect(screen.getByText("Delete Page")).toBeDefined();

      // Delete button is disabled when canDelete is false
      const deleteBtn = screen.getByText("Delete Page").closest("button");
      expect(deleteBtn?.hasAttribute("disabled")).toBe(true);

      // When canDelete is true, delete button is enabled
      rerender(
        <PageOptionsMenu
          x={100}
          y={100}
          pageId="page-1"
          pageName="Test Page"
          canDelete={true}
          hasElements={true}
          onDelete={onDelete}
          onReset={onReset}
          onClose={onClose}
        />
      );

      const enabledDeleteBtn = screen.getByText("Delete Page").closest("button");
      expect(enabledDeleteBtn?.hasAttribute("disabled")).toBe(false);

      // Clicking Reset Page when hasElements=true triggers confirmation state
      const resetBtn = screen.getByText("Reset Page").closest("button")!;
      fireEvent.click(resetBtn);
      expect(screen.getByText("Clear all elements on this page?")).toBeDefined();

      // Clicking confirm Reset calls onReset
      const confirmResetBtn = screen.getByRole("button", { name: "Reset" });
      fireEvent.click(confirmResetBtn);
      expect(onReset).toHaveBeenCalledWith("page-1");
      expect(onClose).toHaveBeenCalled();
    });
  });
});

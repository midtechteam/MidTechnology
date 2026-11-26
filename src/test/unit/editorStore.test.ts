import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"

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
}))

describe("Editor Store", () => {
  it("initializes with correct defaults", async () => {
    const { useEditorStore } = await import("@/stores/editorStore")
    const { result } = renderHook(() => useEditorStore())
    
    expect(result.current.document).toBeNull()
    expect(result.current.activeTool).toBe("select")
    expect(result.current.zoom).toBe(1)
    expect(result.current.selectedElementIds).toEqual([])
    expect(result.current.showGrid).toBe(true)
    expect(result.current.saveStatus).toBe("saved")
  })

  it("setActiveTool updates the active tool", async () => {
    const { useEditorStore } = await import("@/stores/editorStore")
    const { result } = renderHook(() => useEditorStore())
    
    act(() => {
      result.current.setActiveTool("rect")
    })
    
    expect(result.current.activeTool).toBe("rect")
  })

  it("setZoom clamps zoom to valid range", async () => {
    const { useEditorStore } = await import("@/stores/editorStore")
    const { result } = renderHook(() => useEditorStore())
    
    act(() => { result.current.setZoom(5) })
    expect(result.current.zoom).toBeLessThanOrEqual(4)
    
    act(() => { result.current.setZoom(0.001) })
    expect(result.current.zoom).toBeGreaterThanOrEqual(0.05)
  })

  it("undo/redo stack works correctly", async () => {
    const { useEditorStore } = await import("@/stores/editorStore")
    const { createEmptyDocument } = await import("@/types/document")
    const { result } = renderHook(() => useEditorStore())
    
    const doc = createEmptyDocument("Test", "website")
    
    act(() => { result.current.loadDocument(doc) })
    expect(result.current.document).not.toBeNull()
    expect(result.current.undoStack).toHaveLength(0)
  })

  it("clearSelection empties selection", async () => {
    const { useEditorStore } = await import("@/stores/editorStore")
    const { result } = renderHook(() => useEditorStore())
    
    act(() => { result.current.clearSelection() })
    expect(result.current.selectedElementIds).toEqual([])
  })
})

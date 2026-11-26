import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

// Mock IndexedDB
const idbMock = new Map()
vi.mock("@/lib/indexdb", () => ({
  saveDocument: vi.fn().mockResolvedValue(undefined),
  getDocument: vi.fn().mockResolvedValue(null),
  getAllDocuments: vi.fn().mockResolvedValue([]),
  deleteDocument: vi.fn().mockResolvedValue(undefined),
  saveDraft: vi.fn().mockResolvedValue(undefined),
  getDraft: vi.fn().mockResolvedValue(null),
  clearDraft: vi.fn().mockResolvedValue(undefined),
}))

// Mock Konva
vi.mock("konva", () => ({
  default: {
    Stage: vi.fn(),
    Layer: vi.fn(),
    Rect: vi.fn(),
  },
}))

// Mock react-konva
vi.mock("react-konva", () => ({
  Stage: ({ children }: any) => children,
  Layer: ({ children }: any) => children,
  Rect: () => null,
  Ellipse: () => null,
  Text: () => null,
  Line: () => null,
  Arrow: () => null,
  Group: ({ children }: any) => children,
  Image: () => null,
}))

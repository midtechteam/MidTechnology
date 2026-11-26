// Re-export everything from document schema
export * from "./document";

// ─── Project category ────────────────────────────────────────────────────────
export type ProjectCategory =
  | "website"
  | "mobile"
  | "desktop"
  | "tablet"
  | "dashboard"
  | "custom";

// ─── Export format ───────────────────────────────────────────────────────────
export type ExportFormat =
  | "png"
  | "svg"
  | "html"
  | "react"
  | "prompt-txt"
  | "prompt-md";

// ─── Tool type ───────────────────────────────────────────────────────────────
export type ToolType =
  | "select"
  | "frame"
  | "rect"
  | "rounded-rect"
  | "roundedRect"
  | "ellipse"
  | "triangle"
  | "line"
  | "arrow"
  | "connector"
  | "flexible-line"
  | "text"
  | "image"
  | "video"
  | "container"
  | "divider"
  | "section-splitter"
  | "sectionSplitter"
  | "button"
  | "input"
  | "checkbox"
  | "toggle"
  | "search-bar"
  | "nav"
  | "hand";

// ─── Editor tool metadata ────────────────────────────────────────────────────
export interface EditorTool {
  type: ToolType;
  label: string;
  shortcut?: string;
}

// ─── Artboard presets ────────────────────────────────────────────────────────
export interface ArtboardPreset {
  label: string;
  width: number;
  height: number;
}

export const ARTBOARD_PRESETS: Record<string, ArtboardPreset> = {
  desktop: { label: "Desktop", width: 1440, height: 900 },
  laptop: { label: "Laptop", width: 1366, height: 768 },
  tablet: { label: "Tablet", width: 768, height: 1024 },
  mobile: { label: "Mobile", width: 390, height: 844 },
  "tablet-landscape": { label: "Tablet Landscape", width: 1024, height: 768 },
  "mobile-sm": { label: "Mobile SM", width: 375, height: 667 },
  custom: { label: "Custom", width: 800, height: 600 },
};

// ─── Tools list ───────────────────────────────────────────────────────────────
export const TOOLS_LIST: EditorTool[] = [
  { type: "select", label: "Select", shortcut: "V" },
  { type: "hand", label: "Hand", shortcut: "H" },
  { type: "frame", label: "Frame", shortcut: "F" },
  { type: "rect", label: "Rectangle", shortcut: "R" },
  { type: "rounded-rect", label: "Rounded Rectangle" },
  { type: "ellipse", label: "Ellipse", shortcut: "E" },
  { type: "line", label: "Line", shortcut: "L" },
  { type: "arrow", label: "Arrow" },
  { type: "text", label: "Text", shortcut: "T" },
  { type: "image", label: "Image", shortcut: "I" },
  { type: "container", label: "Container", shortcut: "C" },
  { type: "divider", label: "Divider" },
  { type: "section-splitter", label: "Section Splitter" },
  { type: "button", label: "Button", shortcut: "B" },
  { type: "input", label: "Input Field" },
  { type: "search-bar", label: "Search Bar" },
  { type: "nav", label: "Navigation" },
];

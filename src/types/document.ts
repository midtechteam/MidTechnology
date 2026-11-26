import { z } from "zod";

// ─── Version ────────────────────────────────────────────────────────────────
export const DOCUMENT_VERSION = "1.0.0";

// ─── Primitive helpers ───────────────────────────────────────────────────────
export const ColorSchema = z.string();

export const ShadowSchema = z.object({
  color: ColorSchema,
  offsetX: z.number(),
  offsetY: z.number(),
  blur: z.number(),
  spread: z.number().default(0),
  inset: z.boolean().default(false),
});

export const CornerRadiusSchema = z.union([
  z.number(),
  z.object({
    tl: z.number(),
    tr: z.number(),
    br: z.number(),
    bl: z.number(),
  }),
]);

export const PaddingSchema = z.object({
  top: z.number().default(0),
  right: z.number().default(0),
  bottom: z.number().default(0),
  left: z.number().default(0),
});

export const ConstraintsSchema = z.object({
  horizontal: z.enum(["left", "right", "center", "stretch", "scale"]).default("left"),
  vertical: z.enum(["top", "bottom", "center", "stretch", "scale"]).default("top"),
});

// ─── Base Element Schema ─────────────────────────────────────────────────────
export const BaseElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional().default(0),
  opacity: z.number().optional().default(100),
  visible: z.boolean().optional().default(true),
  locked: z.boolean().optional().default(false),
  parentId: z.string().nullable().optional().default(null),
  fill: ColorSchema.optional(),
  stroke: ColorSchema.optional(),
  strokeWidth: z.number().optional(),
  cornerRadius: CornerRadiusSchema.optional(),
  shadow: ShadowSchema.optional(),
  layoutDirection: z.enum(["horizontal", "vertical", "none"]).optional().default("none"),
  gap: z.number().optional(),
  padding: PaddingSchema.optional(),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch", "baseline"]).optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]).optional(),
  flexWrap: z.enum(["nowrap", "wrap", "wrap-reverse"]).optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
  minHeight: z.number().optional(),
  maxHeight: z.number().optional(),
  constraints: ConstraintsSchema.optional(),
});

// ─── Individual Element Schemas ──────────────────────────────────────────────
export const RectElementSchema = BaseElementSchema.extend({
  type: z.literal("rect"),
});

export const EllipseElementSchema = BaseElementSchema.extend({
  type: z.literal("ellipse"),
});

export const TriangleElementSchema = BaseElementSchema.extend({
  type: z.literal("triangle"),
});

export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal("text"),
  content: z.string().default(""),
  fontSize: z.number().default(16),
  fontWeight: z.union([z.string(), z.number()]).default("normal"),
  fontFamily: z.string().default("Inter, sans-serif"),
  textAlign: z.enum(["left", "center", "right", "justify"]).default("left"),
  color: ColorSchema.default("#111827"),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
});

export const LineElementSchema = BaseElementSchema.extend({
  type: z.literal("line"),
  x2: z.number().optional(),
  y2: z.number().optional(),
});

export const ArrowElementSchema = BaseElementSchema.extend({
  type: z.literal("arrow"),
  x2: z.number().optional(),
  y2: z.number().optional(),
  startArrow: z.boolean().default(false),
  endArrow: z.boolean().default(true),
});

export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal("image"),
  src: z.string().optional(),
  objectFit: z.enum(["fill", "contain", "cover", "none", "scale-down"]).default("cover"),
  alt: z.string().optional(),
});

export const FrameElementSchema = BaseElementSchema.extend({
  type: z.literal("frame"),
  clipContent: z.boolean().optional().default(true),
  background: ColorSchema.optional(),
});

export const ContainerElementSchema = BaseElementSchema.extend({
  type: z.literal("container"),
});

export const GroupElementSchema = BaseElementSchema.extend({
  type: z.literal("group"),
  childIds: z.array(z.string()).optional().default([]),
});

export const ComponentElementSchema = BaseElementSchema.extend({
  type: z.literal("component"),
  componentId: z.string(),
  componentVersion: z.string().optional(),
  overrides: z.record(z.string(), z.unknown()).optional(),
});

export const SectionSchema = z.object({
  id: z.string(),
  proportion: z.number().default(1),
  background: ColorSchema.optional(),
  elements: z.array(z.any()).default([]),
});

export const SectionSplitterElementSchema = BaseElementSchema.extend({
  type: z.union([z.literal("sectionSplitter"), z.literal("section-splitter")]),
  sections: z.array(SectionSchema).default([]),
  splitDirection: z.enum(["horizontal", "vertical"]).default("horizontal"),
  spacing: z.number().default(8),
});

export const ConnectorPointSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  isCurved: z.boolean().optional().default(false),
  cpx: z.number().optional(),
  cpy: z.number().optional(),
});

export const ConnectorElementSchema = BaseElementSchema.extend({
  type: z.union([z.literal("connector"), z.literal("flexible-line")]),
  points: z.array(ConnectorPointSchema).default([]),
  curveMode: z.enum(["straight", "curved", "bezier"]).default("straight"),
  lineStyle: z.enum(["solid", "dashed"]).default("solid"),
  startArrow: z.boolean().default(false),
  endArrow: z.boolean().default(false),
  editingPoints: z.boolean().optional().default(true),
});

// Union of all element schemas
export const ElementSchema = z.union([
  RectElementSchema,
  EllipseElementSchema,
  TriangleElementSchema,
  TextElementSchema,
  LineElementSchema,
  ArrowElementSchema,
  ImageElementSchema,
  FrameElementSchema,
  ContainerElementSchema,
  GroupElementSchema,
  ComponentElementSchema,
  SectionSplitterElementSchema,
  ConnectorElementSchema,
]);

// ─── TypeScript Types ────────────────────────────────────────────────────────
export type RectElement = z.infer<typeof RectElementSchema>;
export type EllipseElement = z.infer<typeof EllipseElementSchema>;
export type TriangleElement = z.infer<typeof TriangleElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type LineElement = z.infer<typeof LineElementSchema>;
export type ArrowElement = z.infer<typeof ArrowElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type FrameElement = z.infer<typeof FrameElementSchema>;
export type ContainerElement = z.infer<typeof ContainerElementSchema>;
export type GroupElement = z.infer<typeof GroupElementSchema>;
export type ComponentElement = z.infer<typeof ComponentElementSchema>;
export type SectionSplitterElement = z.infer<typeof SectionSplitterElementSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type ConnectorPoint = z.infer<typeof ConnectorPointSchema>;
export type ConnectorElement = z.infer<typeof ConnectorElementSchema>;
export type Element = z.infer<typeof ElementSchema>;

// ─── Artboard ────────────────────────────────────────────────────────────────
export const ArtboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number(),
  height: z.number(),
  background: ColorSchema.optional().default("#FFFFFF"),
  elements: z.array(ElementSchema).default([]),
  splitDirection: z.enum(["horizontal", "vertical"]).optional(),
  sections: z.number().optional(),
  isLocked: z.boolean().optional().default(false),
});
export type Artboard = z.infer<typeof ArtboardSchema>;

export interface ArtboardPreset {
  label: string;
  width: number;
  height: number;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  artboards: z.array(ArtboardSchema).default([]),
});
export type Page = z.infer<typeof PageSchema>;

// ─── Document Metadata ───────────────────────────────────────────────────────
export const DocumentMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  category: z.enum(["website", "mobile", "desktop", "tablet", "dashboard", "custom"]).default("website"),
  thumbnail: z.string().nullable().optional().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string().default(DOCUMENT_VERSION),
  ownerId: z.string().optional().default(""),
  workspaceId: z.string().optional().default(""),
});
export type DocumentMeta = z.infer<typeof DocumentMetaSchema>;

// ─── Full Document ───────────────────────────────────────────────────────────
export const ScafbindDocumentSchema = z.object({
  meta: DocumentMetaSchema,
  pages: z.array(PageSchema).min(1),
});
export type ScafbindDocument = z.infer<typeof ScafbindDocumentSchema>;
export type DocumentSnapshot = ScafbindDocument;

// ─── Factory: Empty Document ─────────────────────────────────────────────────
export function createEmptyDocument(
  name = "Untitled Wireframe",
  category: "website" | "mobile" | "desktop" | "tablet" | "dashboard" | "custom" = "website"
): ScafbindDocument {
  const pageId = crypto.randomUUID();
  const artboardId = crypto.randomUUID();

  const presetDims: Record<string, { width: number; height: number }> = {
    website: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
    desktop: { width: 1366, height: 768 },
    tablet: { width: 768, height: 1024 },
    dashboard: { width: 1440, height: 900 },
    custom: { width: 1200, height: 800 },
  };

  const dims = presetDims[category] || presetDims.website;
  const now = new Date().toISOString();

  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      description: "",
      category,
      thumbnail: null,
      createdAt: now,
      updatedAt: now,
      version: DOCUMENT_VERSION,
      ownerId: "",
      workspaceId: "",
    },
    pages: [
      {
        id: pageId,
        name: "Page 1",
        artboards: [
          {
            id: artboardId,
            name: `${category.charAt(0).toUpperCase() + category.slice(1)} Screen`,
            x: 80,
            y: 80,
            width: dims.width,
            height: dims.height,
            background: "#FFFFFF",
            elements: [],
            isLocked: false,
          },
        ],
      },
    ],
  };
}

import type { ScafbindDocument, Artboard, Element } from '@/types/document';
import { downloadBlob, downloadText } from '@/lib/utils';

export interface ImageExportOptions {
  scale?: number;
  artboardId?: string;
  transparentBackground?: boolean;
}

/**
 * Generates an SVG string representation of the document or artboard
 */
export function exportToSVG(
  document: ScafbindDocument,
  artboardId?: string,
  pageId?: string
): string {
  let page = pageId ? document.pages.find((p) => p.id === pageId) : undefined;
  if (!page && artboardId) {
    page = document.pages.find((p) => p.artboards.some((ab) => ab.id === artboardId));
  }
  if (!page) {
    page = document.pages[0];
  }
  if (!page) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

  const artboards = artboardId
    ? page.artboards.filter((ab) => ab.id === artboardId)
    : page.artboards;

  if (artboards.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

  // Calculate total canvas bounds
  const minX = Math.min(...artboards.map((ab) => ab.x));
  const minY = Math.min(...artboards.map((ab) => ab.y));
  const maxX = Math.max(...artboards.map((ab) => ab.x + ab.width));
  const maxY = Math.max(...artboards.map((ab) => ab.y + ab.height));
  const pad = 24;
  const viewBoxX = minX - pad;
  const viewBoxY = minY - pad;
  const totalWidth = maxX - minX + pad * 2;
  const totalHeight = maxY - minY + pad * 2;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">\n`;
  svgContent += `  <style>\n    text { font-family: Inter, system-ui, -apple-system, sans-serif; }\n  </style>\n`;

  for (const ab of artboards) {
    svgContent += `  <!-- Artboard: ${ab.name} -->\n`;
    svgContent += `  <g id="${ab.id}" transform="translate(${ab.x}, ${ab.y})">\n`;
    svgContent += `    <rect width="${ab.width}" height="${ab.height}" fill="${ab.background || '#FFFFFF'}" stroke="#E5E7EB" rx="4" />\n`;

    for (const el of ab.elements) {
      if (!el.visible) continue;
      svgContent += renderElementToSVG(el);
    }

    svgContent += `  </g>\n`;
  }

  svgContent += `</svg>`;
  return svgContent;
}

function renderElementToSVG(el: Element): string {
  const opacity = (el.opacity ?? 100) / 100;
  const stroke = el.stroke || 'none';
  const strokeWidth = el.strokeWidth ?? 1;
  const fill = el.fill || '#FFFFFF';

  switch (el.type) {
    case 'rect':
    case 'container':
    case 'frame': {
      const radius = typeof el.cornerRadius === 'number' ? el.cornerRadius : 0;
      return `    <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${radius}" opacity="${opacity}" />\n`;
    }
    case 'ellipse': {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      return `    <ellipse cx="${cx}" cy="${cy}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
    }
    case 'triangle': {
      const p1 = `${el.x + el.width / 2},${el.y}`;
      const p2 = `${el.x + el.width},${el.y + el.height}`;
      const p3 = `${el.x},${el.y + el.height}`;
      return `    <polygon points="${p1} ${p2} ${p3}" fill="${fill}" stroke="${stroke !== 'none' ? stroke : '#7C3AED'}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
    }
    case 'text': {
      const textEl = el as any;
      const fontSize = textEl.fontSize || 16;
      const content = escapeXml(textEl.content || 'Text element');
      const textFill = typeof el.fill === 'string' && el.fill !== '#FFFFFF' ? el.fill : '#111827';
      return `    <text x="${el.x}" y="${el.y + fontSize}" font-size="${fontSize}" fill="${textFill}" font-weight="${textEl.fontWeight || 'normal'}" opacity="${opacity}">${content}</text>\n`;
    }
    case 'arrow': {
      return `    <g opacity="${opacity}">
      <line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y + el.height}" stroke="${stroke !== 'none' ? stroke : '#111827'}" stroke-width="${strokeWidth}" />
    </g>\n`;
    }
    case 'line': {
      return `    <line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y + el.height}" stroke="${stroke !== 'none' ? stroke : '#111827'}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
    }
    case 'image': {
      const radius = typeof el.cornerRadius === 'number' ? el.cornerRadius : 6;
      return `    <g transform="translate(${el.x}, ${el.y})" opacity="${opacity}">
      <rect width="${el.width}" height="${el.height}" fill="#F9FAFB" stroke="${stroke !== 'none' ? stroke : '#D1D5DB'}" stroke-width="${strokeWidth}" rx="${radius}" />
      <line x1="0" y1="0" x2="${el.width}" y2="${el.height}" stroke="#E5E7EB" stroke-width="1" />
      <line x1="0" y1="${el.height}" x2="${el.width}" y2="0" stroke="#E5E7EB" stroke-width="1" />
      <text x="${el.width / 2}" y="${el.height / 2 + 4}" font-size="12" fill="#9CA3AF" text-anchor="middle" font-family="Inter, sans-serif">Image</text>
    </g>\n`;
    }
    case 'video' as any: {
      const radius = typeof el.cornerRadius === 'number' ? el.cornerRadius : 8;
      const cx = el.width / 2;
      const cy = el.height / 2;
      return `    <g transform="translate(${el.x}, ${el.y})" opacity="${opacity}">
      <rect width="${el.width}" height="${el.height}" fill="#18181B" stroke="${stroke !== 'none' ? stroke : '#27272A'}" stroke-width="${strokeWidth}" rx="${radius}" />
      <polygon points="${cx - 10},${cy - 14} ${cx + 14},${cy} ${cx - 10},${cy + 14}" fill="#7C3AED" />
    </g>\n`;
    }
    case 'sectionSplitter':
    case 'section-splitter' as any: {
      const splitter = el as any;
      const sections = splitter.sections || [];
      const splitDirection = splitter.splitDirection || 'horizontal';
      const spacing = splitter.spacing ?? 8;
      const isHorizontal = splitDirection === 'horizontal';
      const totalProportion = sections.reduce((acc: number, s: any) => acc + (s.proportion || 1), 0) || 1;
      const totalSpacing = spacing * Math.max(0, sections.length - 1);
      const availableSpace = (isHorizontal ? el.width : el.height) - totalSpacing;

      let result = `    <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke !== 'none' ? stroke : '#E5E7EB'}" stroke-width="${strokeWidth}" rx="${typeof el.cornerRadius === 'number' ? el.cornerRadius : 8}" opacity="${opacity}" />\n`;

      let currentOffset = 0;
      for (let idx = 0; idx < sections.length; idx++) {
        const section = sections[idx];
        const secDimension = (section.proportion / totalProportion) * availableSpace;
        const sx = isHorizontal ? el.x + currentOffset : el.x;
        const sy = isHorizontal ? el.y : el.y + currentOffset;
        const secW = isHorizontal ? secDimension : el.width;
        const secH = isHorizontal ? el.height : secDimension;
        currentOffset += secDimension + spacing;

        const secBg = section.background || (idx % 2 === 0 ? '#FAFAFA' : '#F4F4F5');
        result += `    <rect x="${sx}" y="${sy}" width="${secW}" height="${secH}" fill="${secBg}" stroke="#E4E4E7" stroke-width="1" rx="4" />\n`;
        result += `    <text x="${sx + 8}" y="${sy + 18}" font-size="11" fill="#71717A" font-weight="500">Section ${idx + 1}</text>\n`;
      }
      return result;
    }
    default:
      return `    <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke !== 'none' ? stroke : '#D1D5DB'}" stroke-width="${strokeWidth}" rx="4" opacity="${opacity}" />\n`;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Downloads SVG file directly to user device
 */
export function downloadSVG(document: ScafbindDocument, filename = 'wireframe.svg') {
  const svg = exportToSVG(document);
  downloadText(svg, filename, 'image/svg+xml');
}

/**
 * Exports Konva stage to PNG blob using HTML5 Canvas
 */
export async function exportStageToPNG(stage: any, filename = 'wireframe.png', scale = 2): Promise<void> {
  if (!stage) return;
  const dataUrl = stage.toDataURL({ pixelRatio: scale });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

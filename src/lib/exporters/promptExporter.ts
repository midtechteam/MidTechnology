import type { ScafbindDocument, Artboard, Element } from '@/types/document';
import { downloadText } from '@/lib/utils';

/**
 * Generates an accurate AI Prompt Specification in TXT format
 * Exactly following project rules: exact coordinates, dimensions, layout, colors, typography
 */
export function exportToPromptTXT(document: ScafbindDocument): string {
  let txt = `================================================================================
SCAFBIND DESIGN SPECIFICATION (PROMPT EXPORT)
Project Name: ${document.meta.name}
Category: ${document.meta.category}
Version: ${document.meta.version}
Generated: ${new Date().toUTCString()}
================================================================================

PROJECT OVERVIEW:
Total Pages: ${document.pages.length}
Description: ${document.meta.description || 'None provided'}

`;

  for (const page of document.pages) {
    txt += `PAGE: ${page.name} (ID: ${page.id})\n`;
    txt += `--------------------------------------------------------------------------------\n`;

    for (const ab of page.artboards) {
      txt += `\nARTBOARD: "${ab.name}" [${ab.width}px × ${ab.height}px]\n`;
      txt += `Background Color: ${ab.background || '#FFFFFF'}\n`;
      txt += `Position in Canvas: x=${ab.x}, y=${ab.y}\n`;
      txt += `Elements Count: ${ab.elements.length}\n\n`;
      txt += `ELEMENTS SPECIFICATION:\n`;

      ab.elements.forEach((el, index) => {
        txt += `\n[${index + 1}] Element "${el.name || el.type}" (${el.type})\n`;
        txt += `    ID: ${el.id}\n`;
        txt += `    Coordinates: Left=${el.x}px, Top=${el.y}px, Width=${el.width}px, Height=${el.height}px\n`;
        txt += `    Appearance: Fill=${el.fill || 'transparent'}, Stroke=${el.stroke || 'none'} (${el.strokeWidth ?? 0}px), Radius=${JSON.stringify(el.cornerRadius || 0)}\n`;
        txt += `    Opacity: ${el.opacity ?? 100}%, Locked: ${el.locked ? 'YES' : 'NO'}, Visible: ${el.visible ? 'YES' : 'NO'}\n`;

        if (el.type === 'text') {
          const t = el as any;
          txt += `    Text Content: "${t.content || ''}"\n`;
          txt += `    Font: Size=${t.fontSize || 16}px, Weight=${t.fontWeight || 'normal'}, Align=${t.textAlign || 'left'}\n`;
        }

        if (el.type === 'sectionSplitter') {
          const s = el as any;
          txt += `    Section Splitter: Direction=${s.splitDirection}, Sections=${s.sections?.length || 0}, Spacing=${s.spacing || 0}px\n`;
        }
      });
    }
    txt += `\n`;
  }

  txt += `\nIMPLEMENTATION INSTRUCTIONS FOR LLM / FRONTEND ENGINEER:
1. Reconstruct this interface using React, TypeScript, and Tailwind CSS.
2. Maintain the exact relative positioning, padding, and corner radius specified above.
3. Replace wireframe placeholder elements with production components where applicable.
4. Ensure responsive responsiveness while honoring the baseline resolution.
================================================================================`;

  return txt;
}

/**
 * Generates Markdown prompt specification with formatted tables
 */
export function exportToPromptMD(document: ScafbindDocument): string {
  let md = `# Scafbind Design Specification: ${document.meta.name}\n\n`;
  md += `> **Category:** ${document.meta.category}  \n`;
  md += `> **Version:** ${document.meta.version}  \n`;
  md += `> **Generated:** ${new Date().toISOString()}  \n\n`;

  md += `## Summary of Artboards\n\n`;
  md += `| Page | Artboard | Dimensions | Elements Count | Background |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  for (const page of document.pages) {
    for (const ab of page.artboards) {
      md += `| ${page.name} | **${ab.name}** | \`${ab.width} × ${ab.height}\` | ${ab.elements.length} | \`${ab.background || '#FFFFFF'}\` |\n`;
    }
  }

  md += `\n---\n\n## Detailed Element Hierarchy\n\n`;

  for (const page of document.pages) {
    md += `### Page: ${page.name}\n\n`;

    for (const ab of page.artboards) {
      md += `#### Artboard: ${ab.name} (\`${ab.width} × ${ab.height}\`)\n\n`;
      md += `| # | Name | Type | X, Y | W, H | Fill | Stroke | Radius |\n`;
      md += `| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

      ab.elements.forEach((el, idx) => {
        const radius = typeof el.cornerRadius === 'number' ? `${el.cornerRadius}px` : '0';
        md += `| ${idx + 1} | ${el.name || el.type} | \`${el.type}\` | ${el.x}, ${el.y} | ${el.width} × ${el.height} | \`${el.fill || 'none'}\` | \`${el.stroke || 'none'}\` | ${radius} |\n`;
      });

      md += `\n`;
    }
  }

  return md;
}

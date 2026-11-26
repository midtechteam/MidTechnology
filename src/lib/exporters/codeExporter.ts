import type { ScafbindDocument, Artboard, Element } from '@/types/document';
import { downloadText } from '@/lib/utils';

/**
 * Generates production-ready semantic HTML & CSS from Scafbind document
 */
export function exportToHTML(document: ScafbindDocument, artboardId?: string): string {
  const page = document.pages[0];
  const artboard = artboardId
    ? page?.artboards.find((ab) => ab.id === artboardId)
    : page?.artboards[0];

  if (!artboard) return '<!-- No artboard found -->';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(document.meta.name)} - Scafbind Wireframe</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #F4F4F5;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }
    .artboard-container {
      position: relative;
      width: ${artboard.width}px;
      height: ${artboard.height}px;
      background-color: ${artboard.background || '#FFFFFF'};
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-radius: 8px;
      overflow: hidden;
    }
    .scafbind-element {
      position: absolute;
      transition: all 0.15s ease;
    }
  </style>
</head>
<body>
  <div class="artboard-container">
`;

  for (const el of artboard.elements) {
    if (!el.visible) continue;
    html += renderElementHTML(el);
  }

  html += `  </div>
</body>
</html>`;

  return html;
}

function renderElementHTML(el: Element): string {
  const style = [
    `left: ${el.x}px`,
    `top: ${el.y}px`,
    `width: ${el.width}px`,
    `height: ${el.height}px`,
    `background-color: ${el.fill || 'transparent'}`,
    `border: ${el.strokeWidth || 0}px solid ${el.stroke || 'transparent'}`,
    `border-radius: ${typeof el.cornerRadius === 'number' ? el.cornerRadius : 0}px`,
    `opacity: ${(el.opacity ?? 100) / 100}`,
  ].join('; ');

  if (el.type === 'text') {
    const textEl = el as any;
    return `    <div class="scafbind-element" style="${style}; font-size: ${textEl.fontSize || 16}px; font-weight: ${textEl.fontWeight || 'normal'}; color: ${el.fill || '#111827'}; display: flex; align-items: center;">${escapeHtml(textEl.content || '')}</div>\n`;
  }

  if (el.type === 'ellipse') {
    return `    <div class="scafbind-element" style="${style}; border-radius: 50%;"></div>\n`;
  }

  if (el.type === 'triangle') {
    return `    <div class="scafbind-element" style="${style}; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div>\n`;
  }

  return `    <div class="scafbind-element" style="${style}"></div>\n`;
}

/**
 * Generates a clean modern React + Tailwind CSS component from Scafbind document
 */
export function exportToReact(document: ScafbindDocument, artboardId?: string): string {
  const page = document.pages[0];
  const artboard = artboardId
    ? page?.artboards.find((ab) => ab.id === artboardId)
    : page?.artboards[0];

  if (!artboard) return '// No artboard found';

  const componentName = document.meta.name
    .replace(/[^a-zA-Z0-9]/g, '')
    .concat('Wireframe') || 'ScafbindWireframe';

  let code = `import React from 'react';

/**
 * ${document.meta.name} - Scafbind Wireframe Component
 * Resolution: ${artboard.width} × ${artboard.height}px
 * Generated: ${new Date().toISOString()}
 */
export const ${componentName}: React.FC = () => {
  return (
    <div className="relative w-[${artboard.width}px] h-[${artboard.height}px] bg-[${artboard.background || '#FFFFFF'}] rounded-xl shadow-xl overflow-hidden border border-gray-100 font-sans">
`;

  for (const el of artboard.elements) {
    if (!el.visible) continue;
    if (el.type === 'text') {
      const textEl = el as any;
      code += `      {/* ${escapeHtml(el.name || 'Text')} */}
      <div
        className="absolute flex items-center"
        style={{
          left: ${el.x},
          top: ${el.y},
          width: ${el.width},
          height: ${el.height},
          fontSize: ${textEl.fontSize || 16},
          fontWeight: '${textEl.fontWeight || 'normal'}',
          color: '${el.fill || '#111827'}',
        }}
      >
        ${escapeHtml(textEl.content || '')}
      </div>\n`;
    } else {
      code += `      {/* ${escapeHtml(el.name || el.type)} */}
      <div
        className="absolute"
        style={{
          left: ${el.x},
          top: ${el.y},
          width: ${el.width},
          height: ${el.height},
          backgroundColor: '${el.fill || '#FFFFFF'}',
          border: '${el.strokeWidth ?? 1}px solid ${el.stroke || '#E5E7EB'}',
          borderRadius: ${el.type === 'ellipse' ? "'9999px'" : typeof el.cornerRadius === 'number' ? el.cornerRadius : 0},
          opacity: ${(el.opacity ?? 100) / 100},
        }}
      />\n`;
    }
  }

  code += `    </div>
  );
};

export default ${componentName};
`;

  return code;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

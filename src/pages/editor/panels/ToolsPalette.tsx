import React, { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  SHAPE_TOOLS,
  TEXT_MEDIA_TOOLS,
  LAYOUT_TOOLS,
  UI_COMPONENTS,
  type ToolItem,
} from '../tools/editorTools';
import { COMPONENT_DEFINITIONS } from '@/lib/componentDefinitions';
import { Search, SplitSquareHorizontal, Plus, Check } from 'lucide-react';

export const ToolsPalette: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    document,
    activeArtboardId,
    activePageId,
    addElement,
  } = useEditorStore();

  const [search, setSearch] = useState('');

  // Find active artboard
  const page = document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
  const artboard = page?.artboards.find((ab) => ab.id === activeArtboardId) || page?.artboards[0];
  const abWidth = artboard?.width || 1440;
  const abHeight = artboard?.height || 900;

  const handleToolClick = (tool: ToolItem) => {
    if (tool.id === 'section-splitter' || (tool.id as string) === 'sectionSplitter') {
      setActiveTool('section-splitter');
      return;
    }

    if (tool.action === 'insert' && tool.createElement && artboard) {
      const el = tool.createElement(abWidth, abHeight);
      addElement(el, artboard.id);
      setActiveTool('select');
      return;
    }

    setActiveTool(tool.id as any);
  };

  const handleInsertComponent = (comp: (typeof COMPONENT_DEFINITIONS)[0]) => {
    if (!artboard) return;
    const el = comp.createElement(60, 60);
    addElement(el, artboard.id);
    setActiveTool('select');
  };

  const matchesSearch = (tool: ToolItem) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      tool.label.toLowerCase().includes(query) ||
      (tool.shortcut && tool.shortcut.toLowerCase().includes(query)) ||
      (tool.description && tool.description.toLowerCase().includes(query))
    );
  };

  const matchedComponents = search.trim()
    ? COMPONENT_DEFINITIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const renderToolGrid = (tools: ToolItem[]) => {
    const filtered = tools.filter(matchesSearch);
    if (filtered.length === 0) return null;

    return (
      <div className="grid grid-cols-4 gap-1.5">
        {filtered.map((tool) => {
          const isActive =
            activeTool === tool.id ||
            (tool.id === 'rounded-rect' && activeTool === 'roundedRect') ||
            (tool.id === 'section-splitter' && activeTool === 'sectionSplitter');

          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
              className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-[#EDE9FE] text-[#7C3AED] ring-2 ring-[#7C3AED]/40 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/90'
              }`}
            >
              <span className="shrink-0">{tool.icon}</span>

              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex items-center gap-1 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none">
                <span>{tool.label}</span>
                {tool.shortcut && (
                  <span className="text-gray-400 font-mono">({tool.shortcut})</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const hasAnyTools =
    SHAPE_TOOLS.some(matchesSearch) ||
    TEXT_MEDIA_TOOLS.some(matchesSearch) ||
    LAYOUT_TOOLS.some(matchesSearch) ||
    UI_COMPONENTS.some(matchesSearch);

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 text-xs p-3 space-y-4 overflow-y-auto select-none">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools or components..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {!hasAnyTools && matchedComponents.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-xs">
          No tools or components found matching &ldquo;{search}&rdquo;.
        </div>
      )}

      {/* Shapes Section */}
      {SHAPE_TOOLS.some(matchesSearch) && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-700 tracking-tight">
            Shapes
          </p>
          {renderToolGrid(SHAPE_TOOLS)}
        </div>
      )}

      {/* Text & Media Section */}
      {TEXT_MEDIA_TOOLS.some(matchesSearch) && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-700 tracking-tight">
            Text & Media
          </p>
          {renderToolGrid(TEXT_MEDIA_TOOLS)}
        </div>
      )}

      {/* Layout & Structure Section */}
      {LAYOUT_TOOLS.some(matchesSearch) && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-700 tracking-tight">
            Layout & Structure
          </p>
          {renderToolGrid(LAYOUT_TOOLS)}
        </div>
      )}

      {/* UI Components Section */}
      {UI_COMPONENTS.some(matchesSearch) && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-700 tracking-tight">
            UI Components
          </p>
          {renderToolGrid(UI_COMPONENTS)}
        </div>
      )}

      {/* Matching Components (if searching) */}
      {matchedComponents.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-purple-700 tracking-tight flex items-center justify-between">
            <span>Matching Components</span>
            <span className="text-[10px] text-gray-400 font-normal">
              {matchedComponents.length} found
            </span>
          </p>
          <div className="space-y-1.5">
            {matchedComponents.slice(0, 4).map((comp) => (
              <div
                key={comp.id}
                onClick={() => handleInsertComponent(comp)}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-purple-50/60 border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-gray-800 text-xs truncate">
                    {comp.name}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {comp.description}
                  </div>
                </div>
                <Plus size={14} className="text-purple-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom: Section Splitter Pill Button */}
      <div className="pt-2 mt-auto">
        <button
          onClick={() => setActiveTool('section-splitter')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#F3E8FF] hover:bg-[#EDE9FE] text-[#7C3AED] font-semibold text-xs border border-[#DDD6FE]/60 transition-all cursor-pointer shadow-2xs active:scale-98"
          title="Divide workspace with Section Splitter modal"
        >
          <SplitSquareHorizontal size={15} />
          <span>Section Splitter</span>
        </button>
      </div>
    </div>
  );
};

export default ToolsPalette;

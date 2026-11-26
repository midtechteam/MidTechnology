import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  SHAPE_TOOLS,
  TEXT_MEDIA_TOOLS,
  LAYOUT_TOOLS,
  UI_COMPONENTS,
  type ToolItem,
} from '../tools/editorTools';
import { COMPONENT_DEFINITIONS } from '@/lib/componentDefinitions';
import type { PanelId } from './useFloatingPanels';
import {
  MousePointer2,
  Hand,
  SlidersHorizontal,
  Layers,
  LayoutGrid,
  Sliders,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Check,
} from 'lucide-react';

interface EditorLeftPanelProps {
  onTogglePanel: (id: PanelId) => void;
  onOpenPanel: (id: PanelId) => void;
  openPanels: Record<PanelId, boolean>;
  onSelectPropertiesTab?: (tab: 'properties' | 'design') => void;
}

export const EditorLeftPanel: React.FC<EditorLeftPanelProps> = ({
  onTogglePanel,
  onOpenPanel,
  openPanels,
  onSelectPropertiesTab,
}) => {
  const {
    activeTool,
    setActiveTool,
    document: editorDoc,
    activeArtboardId,
    activePageId,
    addElement,
    selectedElementIds,
    setSelectedElements,
    updateElement,
  } = useEditorStore();

  const [activeFlyout, setActiveFlyout] = useState<PanelId | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(0);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const page = editorDoc?.pages.find((p) => p.id === activePageId) || editorDoc?.pages[0];
  const artboard = page?.artboards.find((ab) => ab.id === activeArtboardId) || page?.artboards[0];

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 220);
  };

  const handleOpenFlyout = (id: PanelId, e?: React.MouseEvent) => {
    cancelCloseTimer();
    const btn = buttonRefs.current[id];
    if (btn && toolbarRef.current) {
      const btnRect = btn.getBoundingClientRect();
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      setFlyoutTop(Math.max(0, btnRect.top - toolbarRect.top));
    }
    setActiveFlyout(id);
  };

  const handleButtonClick = (id: PanelId, e: React.MouseEvent) => {
    // If touch or clicking, toggle panel and optionally close flyout
    onTogglePanel(id);
    setActiveFlyout(null);
  };

  const handleToolSelect = (tool: ToolItem) => {
    setActiveFlyout(null);

    if (tool.id === 'section-splitter' || (tool.id as string) === 'sectionSplitter') {
      setActiveTool('section-splitter');
      return;
    }

    if (tool.action === 'insert' && tool.createElement) {
      const targetAb = artboard || page?.artboards[0];
      if (targetAb) {
        const el = tool.createElement(targetAb.width, targetAb.height);
        addElement(el, targetAb.id);
        setActiveTool('select');
        return;
      }
    }

    setActiveTool(tool.id as any);
  };

  const handleComponentSelect = (comp: (typeof COMPONENT_DEFINITIONS)[0]) => {
    setActiveFlyout(null);
    const targetAb = artboard || page?.artboards[0];
    if (!targetAb) return;
    const existingCount = targetAb.elements.length;
    const el = comp.createElement(40 + (existingCount % 5) * 20, 40 + (existingCount % 5) * 20);
    addElement(el, targetAb.id);
    setActiveTool('select');
  };

  // Close flyout on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeFlyout) {
        setActiveFlyout(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveFlyout(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [activeFlyout]);

  useEffect(() => {
    return () => cancelCloseTimer();
  }, []);

  return (
    <div
      ref={toolbarRef}
      className="absolute left-3 top-3 z-40 select-none flex items-start"
    >
      {/* 1. COMPACT FLOATING VERTICAL TOOLBAR */}
      <div className="w-[46px] bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-lg flex flex-col items-center py-2 gap-1.5">
        {/* Select Tool (V) */}
        <button
          onClick={() => {
            setActiveTool('select');
            setActiveFlyout(null);
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
            activeTool === 'select'
              ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Select Tool"
        >
          <MousePointer2 size={16} strokeWidth={2.2} />
        </button>

        {/* Pan Tool (H) */}
        <button
          onClick={() => {
            setActiveTool('hand');
            setActiveFlyout(null);
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
            activeTool === 'hand'
              ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label="Pan Tool"
        >
          <Hand size={16} strokeWidth={2} />
        </button>

        {/* Subtle Separator */}
        <div className="w-5 h-px bg-gray-200 my-0.5" />

        {/* 1. Tool Panel */}
        <div
          className="relative"
          onMouseEnter={(e) => handleOpenFlyout('tools', e)}
          onMouseLeave={scheduleClose}
        >
          <button
            ref={(el) => (buttonRefs.current['tools'] = el)}
            onClick={(e) => handleButtonClick('tools', e)}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
              openPanels['tools'] || activeFlyout === 'tools'
                ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Tool Panel"
          >
            <SlidersHorizontal size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 2. Layer Panel */}
        <div
          className="relative"
          onMouseEnter={(e) => handleOpenFlyout('layers', e)}
          onMouseLeave={scheduleClose}
        >
          <button
            ref={(el) => (buttonRefs.current['layers'] = el)}
            onClick={(e) => handleButtonClick('layers', e)}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
              openPanels['layers'] || activeFlyout === 'layers'
                ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Layer Panel"
          >
            <Layers size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 3. Components Library */}
        <div
          className="relative"
          onMouseEnter={(e) => handleOpenFlyout('components', e)}
          onMouseLeave={scheduleClose}
        >
          <button
            ref={(el) => (buttonRefs.current['components'] = el)}
            onClick={(e) => handleButtonClick('components', e)}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
              openPanels['components'] || activeFlyout === 'components'
                ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Components Library"
          >
            <LayoutGrid size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 4. Properties & Design Panel */}
        <div
          className="relative"
          onMouseEnter={(e) => handleOpenFlyout('properties', e)}
          onMouseLeave={scheduleClose}
        >
          <button
            ref={(el) => (buttonRefs.current['properties'] = el)}
            onClick={(e) => handleButtonClick('properties', e)}
            className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer ${
              openPanels['properties'] || activeFlyout === 'properties'
                ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Properties & Design"
            title="Properties & Design"
          >
            <Sliders size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 2. CASCADING MENU / FLYOUT SUBMENU */}
      {activeFlyout && (
        <div
          onMouseEnter={cancelCloseTimer}
          onMouseLeave={scheduleClose}
          style={{ marginTop: flyoutTop }}
          className="ml-2 z-50 bg-white/98 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-xl py-2 px-2 min-w-[210px] max-w-[260px] animate-fade-in select-none relative"
        >
          {/* Hover Bridge: Invisible overlay preventing pointer drop off */}
          <div className="absolute -left-3 top-0 bottom-0 w-3 pointer-events-auto" />

          {/* FLYOUT 1: Tool Panel */}
          {activeFlyout === 'tools' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-xs text-gray-900 tracking-tight">
                  Tool Panel
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenPanel('tools');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  <span>{openPanels['tools'] ? 'Focus' : 'Open'}</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              {/* Quick tool grid */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Shapes
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {SHAPE_TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                          activeTool === tool.id
                            ? 'bg-[#EDE9FE] text-[#7C3AED] font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="shrink-0">{tool.icon}</span>
                        <span className="truncate text-[11px]">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Layout & Structure
                  </span>
                  <div className="space-y-0.5">
                    {LAYOUT_TOOLS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:text-purple-700 hover:bg-purple-50/70 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0 text-gray-500">{tool.icon}</span>
                          <span className="truncate text-[11px]">{tool.label}</span>
                        </div>
                        <span className="text-[9px] text-purple-600 font-semibold bg-purple-50 px-1 py-0.5 rounded">
                          Add
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    UI Components
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {UI_COMPONENTS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:text-purple-700 hover:bg-purple-50/70 transition-colors cursor-pointer text-left"
                      >
                        <span className="shrink-0 text-gray-500">{tool.icon}</span>
                        <span className="truncate text-[11px]">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FLYOUT 2: Layer Panel */}
          {activeFlyout === 'layers' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-xs text-gray-900 tracking-tight">
                  Layer Panel
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenPanel('layers');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  <span>{openPanels['layers'] ? 'Focus' : 'Open'}</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              {/* Quick layer list */}
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 flex justify-between px-1">
                  <span>{artboard?.name || 'Artboard'}</span>
                  <span>{artboard?.elements.length || 0} layers</span>
                </div>

                {artboard?.elements && artboard.elements.length > 0 ? (
                  <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
                    {artboard.elements.slice(0, 8).map((el) => {
                      const isSelected = selectedElementIds.includes(el.id);
                      return (
                        <div
                          key={el.id}
                          onClick={() => {
                            setSelectedElements([el.id]);
                            setActiveFlyout(null);
                          }}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#EDE9FE] text-[#7C3AED] font-semibold'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="truncate text-[11px] flex-1">
                            {el.name || (el.type === 'text' ? (el as any).content || 'Text' : el.type)}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(el.id, { visible: !el.visible });
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-700"
                            >
                              {el.visible ? <Eye size={10} /> : <EyeOff size={10} className="text-red-500" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(el.id, { locked: !el.locked });
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-700"
                            >
                              {el.locked ? <Lock size={10} className="text-amber-500" /> : <Unlock size={10} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-3 text-center text-gray-400 text-[11px] italic">
                    No layers on this artboard
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FLYOUT 3: Components Library */}
          {activeFlyout === 'components' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-xs text-gray-900 tracking-tight">
                  Components Library
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenPanel('components');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  <span>{openPanels['components'] ? 'Focus' : 'Open'}</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              {/* Reusable components list */}
              <div className="space-y-1 max-h-[260px] overflow-y-auto">
                {COMPONENT_DEFINITIONS.slice(0, 6).map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleComponentSelect(comp)}
                    className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-6 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: comp.thumbnailSvg }}
                      />
                      <span className="text-xs font-medium text-gray-800 group-hover:text-purple-700 truncate">
                        {comp.name}
                      </span>
                    </div>
                    <Plus size={13} className="text-gray-400 group-hover:text-purple-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FLYOUT 4: Properties & Design Panel */}
          {activeFlyout === 'properties' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-xs text-gray-900 tracking-tight">
                  Properties & Design
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenPanel('properties');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] bg-[#EDE9FE] hover:bg-[#DDD6FE] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  <span>{openPanels['properties'] ? 'Focus' : 'Open'}</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenPanel('properties');
                    onSelectPropertiesTab?.('properties');
                    setActiveFlyout(null);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-gray-700 hover:text-purple-700 hover:bg-purple-50/70 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <Sliders size={13} className="text-purple-600 shrink-0" />
                    <span>Object Properties</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Position, Size, Style</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenPanel('properties');
                    onSelectPropertiesTab?.('design');
                    setActiveFlyout(null);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-gray-700 hover:text-purple-700 hover:bg-purple-50/70 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal size={13} className="text-purple-600 shrink-0" />
                    <span>Design & Theme</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Palettes, Radii, Canvas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditorLeftPanel;

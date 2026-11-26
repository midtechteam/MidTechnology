import React, { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Tablet,
  Palette,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BringToFront,
  SendToBack,
  Trash2,
  Maximize2,
  Grid,
  Check,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import type { Element, Artboard } from '@/types/document';
import { FloatingPanel } from './FloatingPanel';

export interface EditorRightPanelProps {
  isFloating?: boolean;
  isOpen?: boolean;
  isMinimized?: boolean;
  position?: { x: number; y: number };
  zIndex?: number;
  width?: number;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  onMinimizeToggle?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  activeTab?: 'properties' | 'design';
  onTabChange?: (tab: 'properties' | 'design') => void;
}

export const EditorRightPanel: React.FC<EditorRightPanelProps> = ({
  isFloating = true,
  isOpen = true,
  isMinimized = false,
  position = {
    x: typeof window !== 'undefined' ? Math.max(80, window.innerWidth - 270) : 1000,
    y: 64,
  },
  zIndex = 30,
  width = 255,
  onPositionChange,
  onMinimizeToggle,
  onClose,
  onFocus,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const {
    document,
    selectedElementIds,
    updateElement,
    activeArtboardId,
    activePageId,
    deleteElements,
    updateArtboard,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnap,
    gridSize,
    reorderElement,
    exportAs,
  } = useEditorStore();

  const [internalTab, setInternalTab] = useState<'properties' | 'design'>('properties');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: 'properties' | 'design') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const [aspectLocked, setAspectLocked] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    layout: false,
    grid: false,
    export: false,
    advanced: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activePage = document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
  const activeArtboard =
    activePage?.artboards.find((ab) => ab.id === activeArtboardId) || activePage?.artboards[0];

  // Find currently selected element (single selection priority)
  let selectedElement: Element | null = null;
  if (document && selectedElementIds.length > 0) {
    const targetId = selectedElementIds[0];
    for (const page of document.pages) {
      for (const ab of page.artboards) {
        const found = ab.elements.find((el) => el.id === targetId);
        if (found) {
          selectedElement = found;
          break;
        }
      }
    }
  }

  const handleUpdateElement = (updates: Partial<Element>) => {
    if (selectedElement) {
      updateElement(selectedElement.id, updates);
    }
  };

  const handleUpdateArtboard = (updates: Partial<Artboard>) => {
    if (activeArtboard) {
      updateArtboard(activeArtboard.id, updates);
    }
  };

  const handleWidthChange = (newWidth: number) => {
    if (!selectedElement) return;
    const clampedW = Math.max(1, newWidth);
    if (aspectLocked && selectedElement.width > 0) {
      const ratio = selectedElement.height / selectedElement.width;
      handleUpdateElement({ width: clampedW, height: Math.round(clampedW * ratio) });
    } else {
      handleUpdateElement({ width: clampedW });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (!selectedElement) return;
    const clampedH = Math.max(1, newHeight);
    if (aspectLocked && selectedElement.height > 0) {
      const ratio = selectedElement.width / selectedElement.height;
      handleUpdateElement({ height: clampedH, width: Math.round(clampedH * ratio) });
    } else {
      handleUpdateElement({ height: clampedH });
    }
  };

  // Alignment helpers within artboard
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement || !activeArtboard) return;
    switch (type) {
      case 'left':
        handleUpdateElement({ x: 0 });
        break;
      case 'center':
        handleUpdateElement({ x: Math.round((activeArtboard.width - selectedElement.width) / 2) });
        break;
      case 'right':
        handleUpdateElement({ x: activeArtboard.width - selectedElement.width });
        break;
      case 'top':
        handleUpdateElement({ y: 0 });
        break;
      case 'middle':
        handleUpdateElement({ y: Math.round((activeArtboard.height - selectedElement.height) / 2) });
        break;
      case 'bottom':
        handleUpdateElement({ y: activeArtboard.height - selectedElement.height });
        break;
    }
  };

  const panelContent = (
    <div className="flex flex-col text-gray-800 text-xs select-none">
      {/* Top Tabs: Properties | Design */}
      <div className="flex shrink-0 border-b border-gray-200/90 px-3 pt-1.5 bg-white">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all relative cursor-pointer ${
            activeTab === 'properties' ? 'text-[#7C3AED]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Properties
          {activeTab === 'properties' && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#7C3AED] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all relative cursor-pointer ${
            activeTab === 'design' ? 'text-[#7C3AED]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Design
          {activeTab === 'design' && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#7C3AED] rounded-full" />
          )}
        </button>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-4">
        {activeTab === 'design' ? (
          /* DESIGN PRESETS TAB */
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Brand Palette
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  '#7C3AED',
                  '#6D28D9',
                  '#EDE9FE',
                  '#111827',
                  '#4B5563',
                  '#9CA3AF',
                  '#E5E7EB',
                  '#FFFFFF',
                  '#3B82F6',
                  '#10B981',
                  '#F59E0B',
                  '#EF4444',
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      if (selectedElement) handleUpdateElement({ fill: color });
                      else if (activeArtboard) handleUpdateArtboard({ background: color });
                    }}
                    className="w-8 h-8 rounded-lg border border-gray-200/80 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Corner Radius Presets
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 4, 8, 16].map((r) => (
                  <button
                    key={r}
                    onClick={() => selectedElement && handleUpdateElement({ cornerRadius: r })}
                    className="py-1.5 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-center hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 cursor-pointer"
                  >
                    {r}px
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Typography Styles
              </span>
              <div className="space-y-1">
                {[
                  { name: 'Headline 1', size: 32, weight: 'bold' },
                  { name: 'Headline 2', size: 24, weight: 'bold' },
                  { name: 'Headline 3', size: 18, weight: '600' },
                  { name: 'Body Text', size: 14, weight: 'normal' },
                  { name: 'Caption', size: 12, weight: 'normal' },
                ].map((t) => (
                  <button
                    key={t.name}
                    onClick={() =>
                      selectedElement?.type === 'text' &&
                      handleUpdateElement({ fontSize: t.size, fontWeight: t.weight } as any)
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-transparent hover:border-purple-200 transition-colors cursor-pointer text-left"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{t.size}px</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selectedElement ? (
          /* ELEMENT PROPERTIES (When element is selected) */
          <div className="space-y-4 animate-fade-in">
            {/* Header: Name / Type, Lock, Delete */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <input
                type="text"
                value={selectedElement.name || selectedElement.type}
                onChange={(e) => handleUpdateElement({ name: e.target.value })}
                className="font-semibold text-gray-900 bg-transparent hover:bg-gray-100 focus:bg-white px-1.5 py-0.5 rounded border border-transparent focus:border-purple-400 outline-none truncate max-w-[170px]"
                title="Click to rename element"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdateElement({ locked: !selectedElement?.locked })}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  title={selectedElement.locked ? 'Unlock' : 'Lock'}
                >
                  {selectedElement.locked ? (
                    <Lock size={13} className="text-amber-500" />
                  ) : (
                    <Unlock size={13} />
                  )}
                </button>
                <button
                  onClick={() => deleteElements([selectedElement!.id])}
                  className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete element"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Position & Size */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Position & Size
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] w-4 font-mono">X</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={(e) => handleUpdateElement({ x: Number(e.target.value) })}
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] w-4 font-mono">Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={(e) => handleUpdateElement({ y: Number(e.target.value) })}
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] w-4 font-mono">W</span>
                  <input
                    type="number"
                    min="1"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                </div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] w-4 font-mono">H</span>
                  <input
                    type="number"
                    min="1"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500 flex items-center gap-1">
                  <RotateCw size={12} className="text-gray-400" />
                  Rotation
                </span>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 w-20">
                  <input
                    type="number"
                    value={selectedElement.rotation || 0}
                    onChange={(e) => handleUpdateElement({ rotation: Number(e.target.value) })}
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                  <span className="text-gray-400 text-[10px] ml-0.5 font-mono">°</span>
                </div>
              </div>
            </div>

            {/* Appearance: Fill, Stroke, Opacity */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Appearance
              </span>

              {/* Fill */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fill</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      typeof selectedElement.fill === 'string' && selectedElement.fill.startsWith('#')
                        ? selectedElement.fill
                        : '#FFFFFF'
                    }
                    onChange={(e) => handleUpdateElement({ fill: e.target.value })}
                    className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={typeof selectedElement.fill === 'string' ? selectedElement.fill : '#FFFFFF'}
                    onChange={(e) => handleUpdateElement({ fill: e.target.value })}
                    className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-gray-900 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Stroke / Border */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stroke</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      typeof selectedElement.stroke === 'string' && selectedElement.stroke.startsWith('#')
                        ? selectedElement.stroke
                        : '#E5E7EB'
                    }
                    onChange={(e) => handleUpdateElement({ stroke: e.target.value })}
                    className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={selectedElement.strokeWidth ?? 1}
                    onChange={(e) => handleUpdateElement({ strokeWidth: Number(e.target.value) })}
                    className="w-12 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-gray-900 text-xs font-mono text-center outline-none"
                  />
                </div>
              </div>

              {/* Corner Radius (for rects/containers) */}
              {selectedElement.type !== 'ellipse' && selectedElement.type !== 'line' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Corner Radius</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      typeof selectedElement.cornerRadius === 'number'
                        ? selectedElement.cornerRadius
                        : 0
                    }
                    onChange={(e) => handleUpdateElement({ cornerRadius: Number(e.target.value) })}
                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-gray-900 text-xs font-mono text-right outline-none"
                  />
                </div>
              )}

              {/* Opacity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Opacity</span>
                  <span className="font-mono text-gray-500">{selectedElement.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedElement.opacity ?? 100}
                  onChange={(e) => handleUpdateElement({ opacity: Number(e.target.value) })}
                  className="w-full accent-purple-600 bg-gray-200 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Typography (for text elements) */}
            {selectedElement.type === 'text' && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Type size={12} /> Typography
                </span>

                <div className="space-y-1">
                  <label className="text-gray-500 text-[10px]">Content</label>
                  <textarea
                    rows={2}
                    value={(selectedElement as any).content || ''}
                    onChange={(e) => handleUpdateElement({ content: e.target.value } as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-900 text-xs resize-none outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                    <span className="text-gray-400 text-[10px] mr-1">Size</span>
                    <input
                      type="number"
                      value={(selectedElement as any).fontSize || 16}
                      onChange={(e) =>
                        handleUpdateElement({ fontSize: Number(e.target.value) } as any)
                      }
                      className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                    />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                    <span className="text-gray-400 text-[10px] mr-1">Weight</span>
                    <select
                      value={(selectedElement as any).fontWeight || 'normal'}
                      onChange={(e) =>
                        handleUpdateElement({ fontWeight: e.target.value } as any)
                      }
                      className="w-full bg-transparent text-gray-900 text-xs outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="bold">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                </div>

                {/* Text Align */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Align</span>
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      onClick={() => handleUpdateElement({ textAlign: 'left' } as any)}
                      className={`p-1 rounded ${
                        (selectedElement as any).textAlign === 'left' || !(selectedElement as any).textAlign
                          ? 'bg-white shadow-2xs text-purple-600'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <AlignLeft size={13} />
                    </button>
                    <button
                      onClick={() => handleUpdateElement({ textAlign: 'center' } as any)}
                      className={`p-1 rounded ${
                        (selectedElement as any).textAlign === 'center'
                          ? 'bg-white shadow-2xs text-purple-600'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <AlignCenter size={13} />
                    </button>
                    <button
                      onClick={() => handleUpdateElement({ textAlign: 'right' } as any)}
                      className={`p-1 rounded ${
                        (selectedElement as any).textAlign === 'right'
                          ? 'bg-white shadow-2xs text-purple-600'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <AlignRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Align & Arrange Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Arrange & Align
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleAlign('left')}
                  className="py-1 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-center cursor-pointer"
                  title="Align to Left edge"
                >
                  Left
                </button>
                <button
                  onClick={() => handleAlign('center')}
                  className="py-1 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-center cursor-pointer"
                  title="Align to Center"
                >
                  Center
                </button>
                <button
                  onClick={() => handleAlign('right')}
                  className="py-1 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-center cursor-pointer"
                  title="Align to Right edge"
                >
                  Right
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => reorderElement(selectedElement!.id, 'front')}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[11px] cursor-pointer"
                  title="Bring element to Front"
                >
                  <BringToFront size={13} />
                  <span>To Front</span>
                </button>
                <button
                  onClick={() => reorderElement(selectedElement!.id, 'back')}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[11px] cursor-pointer"
                  title="Send element to Back"
                >
                  <SendToBack size={13} />
                  <span>To Back</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ARTBOARD PROPERTIES (When nothing is selected) - Exact layout matching Reference Image! */
          <div className="space-y-4 animate-fade-in">
            {/* Header: 🖥 Artboard */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                <Monitor size={15} className="text-gray-600" />
                <span>Artboard</span>
              </div>
              {/* Position Lock / Unlock Toggle */}
              <button
                type="button"
                onClick={() =>
                  handleUpdateArtboard({ isLocked: !activeArtboard?.isLocked })
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                  activeArtboard?.isLocked
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={
                  activeArtboard?.isLocked
                    ? 'Position Locked (Click to Unlock)'
                    : 'Position Unlocked (Click to Lock Position)'
                }
              >
                {activeArtboard?.isLocked ? (
                  <>
                    <Lock size={12} className="text-amber-600" />
                    <span>Position Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock size={12} className="text-gray-400" />
                    <span>Unlocked</span>
                  </>
                )}
              </button>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-gray-500 text-[11px] font-medium">Name</label>
              <input
                type="text"
                value={activeArtboard?.name || 'Website Screen'}
                onChange={(e) => handleUpdateArtboard({ name: e.target.value })}
                className="w-full bg-[#F9FAFB] border border-gray-200/90 rounded-lg px-2.5 py-1.5 text-gray-900 text-xs outline-none focus:border-purple-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Position: X and Y */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-gray-500 text-[11px] font-medium">Position</label>
                {activeArtboard?.isLocked && (
                  <span className="text-[10px] text-amber-600 font-medium">Locked</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#F9FAFB] border border-gray-200/90 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] font-mono mr-1">X</span>
                  <input
                    type="number"
                    disabled={activeArtboard?.isLocked}
                    value={Math.round(activeArtboard?.x ?? 0)}
                    onChange={(e) =>
                      handleUpdateArtboard({ x: Number(e.target.value) || 0 })
                    }
                    className={`w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none ${
                      activeArtboard?.isLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div className="flex-1 flex items-center bg-[#F9FAFB] border border-gray-200/90 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] font-mono mr-1">Y</span>
                  <input
                    type="number"
                    disabled={activeArtboard?.isLocked}
                    value={Math.round(activeArtboard?.y ?? 0)}
                    onChange={(e) =>
                      handleUpdateArtboard({ y: Number(e.target.value) || 0 })
                    }
                    className={`w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none ${
                      activeArtboard?.isLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Size: W and H with aspect ratio lock */}
            <div className="space-y-1">
              <label className="text-gray-500 text-[11px] font-medium">Size</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#F9FAFB] border border-gray-200/90 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] font-mono mr-1">W</span>
                  <input
                    type="number"
                    min="100"
                    value={activeArtboard?.width || 1440}
                    onChange={(e) =>
                      handleUpdateArtboard({ width: Math.max(100, Number(e.target.value)) })
                    }
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                </div>
                <div className="flex-1 flex items-center bg-[#F9FAFB] border border-gray-200/90 rounded-lg px-2 py-1">
                  <span className="text-gray-400 text-[10px] font-mono mr-1">H</span>
                  <input
                    type="number"
                    min="100"
                    value={activeArtboard?.height || 900}
                    onChange={(e) =>
                      handleUpdateArtboard({ height: Math.max(100, Number(e.target.value)) })
                    }
                    className="w-full bg-transparent text-gray-900 font-mono text-xs text-right outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAspectLocked((v) => !v)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    aspectLocked
                      ? 'border-purple-300 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-400 hover:text-gray-700'
                  }`}
                  title={aspectLocked ? 'Aspect Ratio Locked' : 'Lock Aspect Ratio'}
                >
                  <Lock size={13} />
                </button>
              </div>
            </div>

            {/* Background: circle color preview, hex text, opacity, eye */}
            <div className="space-y-1">
              <label className="text-gray-500 text-[11px] font-medium">Background</label>
              <div className="flex items-center justify-between bg-[#F9FAFB] border border-gray-200/90 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      activeArtboard?.background && activeArtboard.background.startsWith('#')
                        ? activeArtboard.background
                        : '#FFFFFF'
                    }
                    onChange={(e) => handleUpdateArtboard({ background: e.target.value })}
                    className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer p-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-gray-800 font-medium">
                    {activeArtboard?.background || '#FFFFFF'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">100%</span>
                  <button className="text-gray-400 hover:text-gray-700">
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Accordions matching Reference Image: Layout, Grid & Guides, Export, Advanced */}
            <div className="border-t border-gray-100 pt-2 space-y-1">
              {/* Layout Accordion */}
              <div>
                <button
                  onClick={() => toggleSection('layout')}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sliders size={14} className="text-gray-500" />
                    Layout
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${
                      openSections.layout ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.layout && (
                  <div className="pb-3 pt-1 space-y-1.5 animate-fade-in">
                    <p className="text-[10px] text-gray-400 mb-1">Canvas Presets</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleUpdateArtboard({ width: 1440, height: 900 })}
                        className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-purple-300 text-left cursor-pointer"
                      >
                        <p className="font-semibold text-gray-800 text-[11px]">Website</p>
                        <p className="text-[10px] text-gray-400 font-mono">1440 × 900</p>
                      </button>
                      <button
                        onClick={() => handleUpdateArtboard({ width: 390, height: 844 })}
                        className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-purple-300 text-left cursor-pointer"
                      >
                        <p className="font-semibold text-gray-800 text-[11px]">Mobile</p>
                        <p className="text-[10px] text-gray-400 font-mono">390 × 844</p>
                      </button>
                      <button
                        onClick={() => handleUpdateArtboard({ width: 768, height: 1024 })}
                        className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-purple-300 text-left cursor-pointer"
                      >
                        <p className="font-semibold text-gray-800 text-[11px]">Tablet</p>
                        <p className="text-[10px] text-gray-400 font-mono">768 × 1024</p>
                      </button>
                      <button
                        onClick={() => handleUpdateArtboard({ width: 1920, height: 1080 })}
                        className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-purple-300 text-left cursor-pointer"
                      >
                        <p className="font-semibold text-gray-800 text-[11px]">Desktop</p>
                        <p className="text-[10px] text-gray-400 font-mono">1920 × 1080</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid & Guides Accordion */}
              <div>
                <button
                  onClick={() => toggleSection('grid')}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Grid size={14} className="text-gray-500" />
                    Grid & Guides
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${
                      openSections.grid ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.grid && (
                  <div className="pb-3 pt-1 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Show Grid</span>
                      <button
                        type="button"
                        onClick={toggleGrid}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          showGrid ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            showGrid ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Snap to Grid</span>
                      <button
                        type="button"
                        onClick={toggleSnap}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                          snapToGrid ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            snapToGrid ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Accordion */}
              <div>
                <button
                  onClick={() => toggleSection('export')}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Maximize2 size={14} className="text-gray-500" />
                    Export
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${
                      openSections.export ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.export && (
                  <div className="pb-3 pt-1 space-y-1.5 animate-fade-in">
                    <button
                      onClick={() => exportAs('PNG')}
                      className="w-full py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-xs font-medium text-gray-700 flex justify-between"
                    >
                      <span>Export Artboard as PNG</span>
                      <span className="text-gray-400 font-mono">.png</span>
                    </button>
                    <button
                      onClick={() => exportAs('SVG')}
                      className="w-full py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-xs font-medium text-gray-700 flex justify-between"
                    >
                      <span>Export Artboard as SVG</span>
                      <span className="text-gray-400 font-mono">.svg</span>
                    </button>
                    <button
                      onClick={() => exportAs('React')}
                      className="w-full py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-xs font-medium text-gray-700 flex justify-between"
                    >
                      <span>Export Artboard as React</span>
                      <span className="text-gray-400 font-mono">.tsx</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Accordion */}
              <div>
                <button
                  onClick={() => toggleSection('advanced')}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sliders size={14} className="text-gray-500" />
                    Advanced
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${
                      openSections.advanced ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSections.advanced && (
                  <div className="pb-3 pt-1 space-y-2 animate-fade-in text-gray-600">
                    <div className="flex justify-between text-xs">
                      <span>Artboard ID:</span>
                      <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">
                        {activeArtboard?.id}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Elements:</span>
                      <span className="font-mono text-purple-600 font-semibold">
                        {activeArtboard?.elements.length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFloating) {
    return (
      <FloatingPanel
        id="properties"
        title="Properties & Design"
        isOpen={isOpen}
        isMinimized={isMinimized}
        position={position}
        zIndex={zIndex}
        width={width}
        onPositionChange={onPositionChange || (() => {})}
        onMinimizeToggle={onMinimizeToggle || (() => {})}
        onClose={onClose || (() => {})}
        onFocus={onFocus || (() => {})}
      >
        {panelContent}
      </FloatingPanel>
    );
  }

  return (
    <aside className="w-[240px] h-full bg-white border-l border-gray-200/90 flex flex-col text-gray-800 text-xs shrink-0 select-none overflow-hidden z-20 shadow-2xs">
      {panelContent}
    </aside>
  );
};

export default EditorRightPanel;

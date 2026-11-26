import React, { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Circle,
  Triangle,
  Type,
  Image as ImageIcon,
  Layout,
  Minus,
  ArrowRight,
  Layers,
  SplitSquareHorizontal,
  ChevronDown,
  ChevronRight,
  Trash2,
  Video,
  ChevronUp,
} from 'lucide-react';

function getTypeIcon(type: string) {
  const size = 13;
  switch (type) {
    case 'rect':
    case 'roundedRect':
    case 'rounded-rect':
      return <Square size={size} />;
    case 'ellipse':
      return <Circle size={size} />;
    case 'triangle':
      return <Triangle size={size} />;
    case 'text':
      return <Type size={size} />;
    case 'image':
      return <ImageIcon size={size} />;
    case 'video':
      return <Video size={size} />;
    case 'line':
      return <Minus size={size} />;
    case 'arrow':
      return <ArrowRight size={size} />;
    case 'frame':
    case 'container':
      return <Layers size={size} />;
    case 'sectionSplitter':
    case 'section-splitter':
      return <SplitSquareHorizontal size={size} />;
    default:
      return <Square size={size} />;
  }
}

export const LayersPanel: React.FC = () => {
  const {
    document,
    activePageId,
    selectedElementIds,
    setSelectedElements,
    addToSelection,
    updateElement,
    deleteElements,
    activeArtboardId,
    setActiveArtboard,
    clearSelection,
    reorderElement,
  } = useEditorStore();

  const [expandedArtboards, setExpandedArtboards] = useState<Record<string, boolean>>({});

  const activePage = document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
  const artboards = activePage?.artboards || [];

  const toggleExpand = (id: string) => {
    setExpandedArtboards((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const totalElements = artboards.reduce((acc, a) => acc + a.elements.length, 0);

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 text-xs p-2.5 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 mb-2">
        <span>Layers & Tree</span>
        <span className="text-[10px] text-gray-400 font-normal lowercase">
          {totalElements} {totalElements === 1 ? 'item' : 'items'}
        </span>
      </div>

      {artboards.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-xs leading-relaxed">
          No artboard yet.<br />Add a frame or artboard to start wireframing.
        </div>
      ) : (
        artboards.map((artboard) => {
          const isExpanded = expandedArtboards[artboard.id] !== false;
          const isArtboardActive = activeArtboardId === artboard.id;

          return (
            <div key={artboard.id} className="mb-2">
              {/* Artboard item row */}
              <div
                onClick={() => {
                  setActiveArtboard(artboard.id);
                  clearSelection();
                }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isArtboardActive && selectedElementIds.length === 0
                    ? 'bg-[#EDE9FE] text-[#7C3AED] font-semibold'
                    : 'text-gray-700 hover:bg-gray-100/80'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(artboard.id);
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title={isExpanded ? 'Collapse artboard' : 'Expand artboard'}
                >
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <Layout size={13} className="text-purple-600 shrink-0" />
                <span className="truncate flex-1 text-xs">{artboard.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {artboard.width}×{artboard.height}
                </span>
              </div>

              {/* Elements inside Artboard */}
              {isExpanded && (
                <div className="ml-3 pl-2 border-l border-gray-200/70 space-y-0.5 mt-1">
                  {artboard.elements.length === 0 ? (
                    <div className="py-2 px-2 text-[10px] text-gray-400 italic">
                      Empty artboard
                    </div>
                  ) : (
                    artboard.elements.map((el, elIdx) => {
                      const isSelected = selectedElementIds.includes(el.id);

                      return (
                        <div
                          key={el.id}
                          onClick={(e) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              addToSelection(el.id);
                            } else {
                              setSelectedElements([el.id]);
                            }
                          }}
                          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#EDE9FE] text-[#7C3AED] font-medium ring-1 ring-[#7C3AED]/30'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <span className={isSelected ? 'text-[#7C3AED]' : 'text-gray-400'}>
                            {getTypeIcon(el.type)}
                          </span>
                          <span className="truncate flex-1 text-[11px]">
                            {el.name || (el.type === 'text' ? (el as any).content || 'Text' : el.type)}
                          </span>

                          {/* Quick Actions (Reorder / Visibility / Lock / Delete) */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Reorder Up */}
                            {elIdx < artboard.elements.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderElement(el.id, 'up');
                                }}
                                className="p-0.5 text-gray-400 hover:text-purple-600 cursor-pointer"
                                title="Move Forward"
                              >
                                <ChevronUp size={11} />
                              </button>
                            )}
                            {/* Reorder Down */}
                            {elIdx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderElement(el.id, 'down');
                                }}
                                className="p-0.5 text-gray-400 hover:text-purple-600 cursor-pointer"
                                title="Move Backward"
                              >
                                <ChevronDown size={11} />
                              </button>
                            )}
                            {/* Visibility */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(el.id, { visible: !el.visible });
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                              title={el.visible ? 'Hide layer' : 'Show layer'}
                            >
                              {el.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-red-500" />}
                            </button>
                            {/* Lock */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(el.id, { locked: !el.locked });
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                              title={el.locked ? 'Unlock layer' : 'Lock layer'}
                            >
                              {el.locked ? <Lock size={11} className="text-amber-500" /> : <Unlock size={11} />}
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElements([el.id]);
                              }}
                              className="p-0.5 text-gray-400 hover:text-red-600 cursor-pointer"
                              title="Delete layer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default LayersPanel;

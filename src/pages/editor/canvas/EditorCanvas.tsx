import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { ArtboardRenderer } from './ArtboardRenderer';
import { CanvasRulers } from './CanvasRulers';
import { CanvasContextMenu } from './CanvasContextMenu';
import { PageOptionsMenu } from './PageOptionsMenu';
import { SectionSplitterTool } from '../tools/SectionSplitterTool';
import { generateId } from '@/lib/utils';
import type { Element } from '@/types/document';
import {
  MousePointer2,
  Hand,
  Grid,
  Maximize2,
  Sliders,
} from 'lucide-react';

export interface EditorCanvasProps {
  onToggleProperties?: () => void;
  isPropertiesOpen?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  onToggleProperties,
  isPropertiesOpen = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [splitterModalOpen, setSplitterModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    element: Element;
    meta?: {
      pointIndex?: number;
      clickRelX?: number;
      clickRelY?: number;
    };
  } | null>(null);
  const [pageOptionsMenu, setPageOptionsMenu] = useState<{
    x: number;
    y: number;
    pageId: string;
    pageName: string;
  } | null>(null);
  const [canvasTooltip, setCanvasTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const hasAutoFitRef = useRef(false);

  const {
    document,
    activePageId,
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    fitScreen,
    showGrid,
    toggleGrid,
    gridSize,
    selectedElementIds,
    setSelectedElements,
    addToSelection,
    clearSelection,
    addElement,
    updateElement,
    deleteElements,
    duplicateElements,
    reorderElement,
    activeArtboardId,
    setActivePage,
    setActiveArtboard,
    updateArtboard,
    deletePage,
    resetPage,
  } = useEditorStore();

  // Collect all artboards across all pages to render on the shared canvas
  const allArtboards = useMemo(() => {
    return (document?.pages || []).flatMap((p) =>
      (p.artboards || []).map((ab) => ({
        ...ab,
        pageId: p.id,
        pageName: p.name,
      }))
    );
  }, [document?.pages]);

  const activePage = useMemo(() => {
    return document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
  }, [document?.pages, activePageId]);

  const targetArtboard = useMemo(() => {
    return (
      allArtboards.find((ab) => ab.id === activeArtboardId) ||
      allArtboards.find((ab) => ab.pageId === activePageId) ||
      allArtboards[0]
    );
  }, [allArtboards, activeArtboardId, activePageId]);

  // Viewport centering when active screen changes and is out of view
  const prevActiveArtboardIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeArtboardId && activeArtboardId !== prevActiveArtboardIdRef.current) {
      prevActiveArtboardIdRef.current = activeArtboardId;
      const target = allArtboards.find((ab) => ab.id === activeArtboardId);
      if (target && containerRef.current) {
        const vw = containerRef.current.offsetWidth || stageSize.width;
        const vh = containerRef.current.offsetHeight || stageSize.height;

        const screenLeft = panX + target.x * zoom;
        const screenTop = panY + target.y * zoom;
        const screenRight = screenLeft + target.width * zoom;
        const screenBottom = screenTop + target.height * zoom;

        const isVisible =
          screenLeft >= 40 &&
          screenTop >= 40 &&
          screenRight <= vw - 40 &&
          screenBottom <= vh - 40;

        if (!isVisible) {
          // Smoothly pan so target screen is comfortably visible
          const newPanX = Math.round((vw - target.width * zoom) / 2 - target.x * zoom);
          const newPanY = Math.round((vh - target.height * zoom) / 2 - target.y * zoom);
          setPan(newPanX, newPanY);
        }
      }
    }
  }, [activeArtboardId]);

  // Dismiss context menu when page changes
  useEffect(() => {
    setContextMenu(null);
  }, [activePageId]);

  // Watch container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        if (w > 0 && h > 0) {
          setStageSize((prev) => {
            if (prev.width === w && prev.height === h) return prev;
            return { width: w, height: h };
          });

          // Auto-fit on first load when container size is known
          if (!hasAutoFitRef.current && w > 200 && h > 200) {
            hasAutoFitRef.current = true;
            fitScreen(w, h);
          }
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [fitScreen]);

  // Check if Section Splitter tool selected
  useEffect(() => {
    if (activeTool === 'section-splitter' || (activeTool as string) === 'sectionSplitter') {
      setSplitterModalOpen(true);
      setActiveTool('select');
    }
  }, [activeTool, setActiveTool]);

  // Mouse wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    setContextMenu(null);
    const scaleBy = 1.05;
    const oldScale = zoom;
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(4.0, Number(newScale.toFixed(2))));

    setZoom(clampedScale);
    setPan(
      Math.round(pointer.x - mousePointTo.x * clampedScale),
      Math.round(pointer.y - mousePointTo.y * clampedScale)
    );
  };

  // Create element at target artboard coordinates
  const handleCreateElementAt = (worldX: number, worldY: number) => {
    // Find which artboard contains (worldX, worldY), otherwise fallback to targetArtboard
    const containingAb = allArtboards.find(
      (ab) =>
        worldX >= ab.x &&
        worldX <= ab.x + ab.width &&
        worldY >= ab.y &&
        worldY <= ab.y + ab.height
    ) || targetArtboard;

    if (!containingAb) return;

    if (containingAb.id !== activeArtboardId) {
      setActivePage(containingAb.pageId);
      setActiveArtboard(containingAb.id);
    }

    const relX = Math.round(worldX - containingAb.x);
    const relY = Math.round(worldY - containingAb.y);

    let newEl: any;
    switch (activeTool as string) {
      case 'rect':
        newEl = {
          id: generateId(),
          type: 'rect',
          name: 'Rectangle',
          x: relX,
          y: relY,
          width: 180,
          height: 120,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 0,
        };
        break;

      case 'rounded-rect':
      case 'roundedRect':
        newEl = {
          id: generateId(),
          type: 'rect',
          name: 'Rounded Rectangle',
          x: relX,
          y: relY,
          width: 180,
          height: 120,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 8,
        };
        break;

      case 'ellipse':
        newEl = {
          id: generateId(),
          type: 'ellipse',
          name: 'Ellipse',
          x: relX,
          y: relY,
          width: 120,
          height: 120,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#EDE9FE',
          stroke: '#7C3AED',
          strokeWidth: 1.5,
        };
        break;

      case 'triangle':
        newEl = {
          id: generateId(),
          type: 'triangle',
          name: 'Triangle',
          x: relX,
          y: relY,
          width: 140,
          height: 120,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#EDE9FE',
          stroke: '#7C3AED',
          strokeWidth: 1.5,
        };
        break;

      case 'line':
        newEl = {
          id: generateId(),
          type: 'line',
          name: 'Line',
          x: relX,
          y: relY,
          width: 200,
          height: 0,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          stroke: '#111827',
          strokeWidth: 2,
        };
        break;

      case 'arrow':
        newEl = {
          id: generateId(),
          type: 'arrow',
          name: 'Arrow',
          x: relX,
          y: relY,
          width: 200,
          height: 0,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          stroke: '#111827',
          strokeWidth: 2,
        };
        break;

      case 'connector':
      case 'flexible-line':
        newEl = {
          id: generateId(),
          type: 'connector',
          name: 'Flexible Connector',
          x: relX,
          y: relY,
          width: 200,
          height: 100,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          stroke: '#7C3AED',
          strokeWidth: 2,
          points: [
            { id: generateId(), x: 0, y: 0, isCurved: false },
            { id: generateId(), x: 100, y: 40, isCurved: false },
            { id: generateId(), x: 200, y: 80, isCurved: false },
          ],
          curveMode: 'straight',
          lineStyle: 'solid',
          startArrow: false,
          endArrow: false,
          editingPoints: true,
        };
        break;

      case 'text':
        newEl = {
          id: generateId(),
          type: 'text',
          name: 'Text',
          x: relX,
          y: relY,
          width: 220,
          height: 40,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#111827',
          content: 'Add text here',
          fontSize: 16,
          fontWeight: 'normal',
        };
        break;

      case 'image':
        newEl = {
          id: generateId(),
          type: 'image',
          name: 'Image Placeholder',
          x: relX,
          y: relY,
          width: 280,
          height: 180,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#F9FAFB',
          stroke: '#D1D5DB',
          strokeWidth: 1,
          cornerRadius: 6,
        };
        break;

      case 'video':
        newEl = {
          id: generateId(),
          type: 'video',
          name: 'Video Player',
          x: relX,
          y: relY,
          width: 360,
          height: 200,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#18181B',
          stroke: '#7C3AED',
          strokeWidth: 1,
          cornerRadius: 8,
        };
        break;

      case 'frame':
      case 'container':
        newEl = {
          id: generateId(),
          type: 'frame',
          name: 'Frame Container',
          x: relX,
          y: relY,
          width: 360,
          height: 240,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 8,
        };
        break;

      case 'button':
      case 'comp_button':
        newEl = {
          id: generateId(),
          type: 'rect',
          name: 'Button',
          x: relX,
          y: relY,
          width: 140,
          height: 44,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#7C3AED',
          stroke: '#6D28D9',
          strokeWidth: 0,
          cornerRadius: 8,
        };
        break;

      case 'input':
      case 'comp_input':
        newEl = {
          id: generateId(),
          type: 'rect',
          name: 'Input Field',
          x: relX,
          y: relY,
          width: 280,
          height: 42,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#D1D5DB',
          strokeWidth: 1,
          cornerRadius: 6,
        };
        break;

      case 'checkbox':
      case 'comp_checkbox':
        newEl = {
          id: generateId(),
          type: 'rect',
          name: 'Checkbox',
          x: relX,
          y: relY,
          width: 20,
          height: 20,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#7C3AED',
          stroke: '#6D28D9',
          strokeWidth: 0,
          cornerRadius: 4,
        };
        break;

      case 'toggle':
      case 'comp_toggle':
        newEl = {
          id: generateId(),
          type: 'rect',
          name: 'Toggle Switch',
          x: relX,
          y: relY,
          width: 44,
          height: 24,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#7C3AED',
          stroke: '#6D28D9',
          strokeWidth: 0,
          cornerRadius: 12,
        };
        break;

      case 'media':
        newEl = {
          id: generateId(),
          type: 'image',
          name: 'Media Player',
          x: relX,
          y: relY,
          width: 480,
          height: 270,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#1E1E24',
          stroke: '#7C3AED',
          strokeWidth: 1,
          cornerRadius: 12,
        };
        break;

      case 'layout-header':
        newEl = {
          id: generateId(),
          type: 'sectionSplitter',
          name: 'Header + Body Layout',
          x: relX,
          y: relY,
          width: Math.min(Math.max(500, targetArtboard.width - relX - 20), 1100),
          height: 480,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 8,
          splitDirection: 'vertical',
          sections: [
            { id: generateId(), proportion: 1, background: '#F8FAFC', elements: [] },
            { id: generateId(), proportion: 5, background: '#FFFFFF', elements: [] },
          ],
          spacing: 8,
        };
        break;

      case 'layout-2col':
        newEl = {
          id: generateId(),
          type: 'sectionSplitter',
          name: '2-Column Grid',
          x: relX,
          y: relY,
          width: Math.min(Math.max(400, targetArtboard.width - relX - 20), 800),
          height: 380,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 8,
          splitDirection: 'horizontal',
          sections: [
            { id: generateId(), proportion: 1, background: '#FFFFFF', elements: [] },
            { id: generateId(), proportion: 1, background: '#F9FAFB', elements: [] },
          ],
          spacing: 12,
        };
        break;

      case 'layout-3col':
        newEl = {
          id: generateId(),
          type: 'sectionSplitter',
          name: '3-Column Grid',
          x: relX,
          y: relY,
          width: Math.min(Math.max(500, targetArtboard.width - relX - 20), 960),
          height: 340,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 8,
          splitDirection: 'horizontal',
          sections: [
            { id: generateId(), proportion: 1, background: '#FFFFFF', elements: [] },
            { id: generateId(), proportion: 1, background: '#F9FAFB', elements: [] },
            { id: generateId(), proportion: 1, background: '#FFFFFF', elements: [] },
          ],
          spacing: 12,
        };
        break;

      case 'layout-rows':
        newEl = {
          id: generateId(),
          type: 'sectionSplitter',
          name: 'Rows Stack',
          x: relX,
          y: relY,
          width: Math.min(Math.max(400, targetArtboard.width - relX - 20), 720),
          height: 420,
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          fill: '#FFFFFF',
          stroke: '#E5E7EB',
          strokeWidth: 1,
          cornerRadius: 8,
          splitDirection: 'vertical',
          sections: [
            { id: generateId(), proportion: 1, background: '#FFFFFF', elements: [] },
            { id: generateId(), proportion: 1, background: '#F9FAFB', elements: [] },
            { id: generateId(), proportion: 1, background: '#FFFFFF', elements: [] },
          ],
          spacing: 10,
        };
        break;

      case 'section-splitter':
      case 'sectionSplitter':
        setSplitterModalOpen(true);
        setActiveTool('select');
        return;

      default:
        return;
    }

    addElement(newEl, targetArtboard.id);
    setSelectedElements([newEl.id]);
    setActiveTool('select');
  };

  const CREATING_TOOLS = [
    'rect',
    'rounded-rect',
    'roundedRect',
    'ellipse',
    'triangle',
    'line',
    'arrow',
    'text',
    'image',
    'video',
    'media',
    'frame',
    'container',
    'button',
    'comp_button',
    'input',
    'comp_input',
    'checkbox',
    'comp_checkbox',
    'toggle',
    'comp_toggle',
    'layout-header',
    'layout-2col',
    'layout-3col',
    'layout-rows',
    'section-splitter',
    'sectionSplitter',
    'connector',
    'flexible-line',
  ];

  const handleElementContextMenu = useCallback((element: Element, clientX: number, clientY: number, meta?: any) => {
    // If the right-clicked element is not already selected, select it
    if (!selectedElementIds.includes(element.id)) {
      setSelectedElements([element.id]);
    }
    setContextMenu({
      x: clientX,
      y: clientY,
      element,
      meta,
    });
  }, [selectedElementIds, setSelectedElements]);

  // Stage click: creation or deselection
  const handleStageClick = (e: any) => {
    setContextMenu(null);
    setPageOptionsMenu(null);
    const isCreatingShape = CREATING_TOOLS.includes(activeTool as string);

    if (isCreatingShape) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldX = (pointer.x - panX) / zoom;
      const worldY = (pointer.y - panY) / zoom;

      handleCreateElementAt(worldX, worldY);
      return;
    }

    // Direct background click: clear selection
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  };

  const isShapeTool = CREATING_TOOLS.includes(activeTool as string);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 w-full h-full bg-[#F5F6FA] overflow-hidden ${
        activeTool === 'hand'
          ? 'cursor-grab active:cursor-grabbing'
          : isShapeTool
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      {/* Horizontal and Vertical Rulers matching Reference Image */}
      {targetArtboard && (
        <CanvasRulers
          width={stageSize.width}
          height={stageSize.height}
          zoom={zoom}
          panX={panX}
          panY={panY}
          artboardX={targetArtboard.x}
          artboardY={targetArtboard.y}
          artboardWidth={targetArtboard.width}
          artboardHeight={targetArtboard.height}
        />
      )}

      {/* Main Konva Stage */}
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        draggable={activeTool === 'hand'}
        x={panX}
        y={panY}
        scaleX={zoom}
        scaleY={zoom}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={(e) => {
          if (activeTool === 'hand') {
            setPan(Math.round(e.target.x()), Math.round(e.target.y()));
          }
        }}
      >
        <Layer>
          {/* Render all screens/artboards across all pages in the shared canvas */}
          {allArtboards.map((artboard) => (
            <ArtboardRenderer
              key={artboard.id}
              artboard={artboard}
              isActiveScreen={artboard.id === activeArtboardId || artboard.pageId === activePageId}
              showGrid={showGrid}
              gridSize={gridSize}
              selectedElementIds={selectedElementIds}
              activeTool={activeTool}
              onSelectScreen={() => {
                setActivePage(artboard.pageId);
                setActiveArtboard(artboard.id);
              }}
              onSelectElement={(id, isMulti) => {
                if (artboard.id !== activeArtboardId) {
                  setActivePage(artboard.pageId);
                  setActiveArtboard(artboard.id);
                }
                if (isMulti) {
                  addToSelection(id);
                } else {
                  setSelectedElements([id]);
                }
              }}
              onUpdateElement={(id, updates) => {
                updateElement(id, updates);
              }}
              onUpdateArtboard={(updates) => {
                updateArtboard(artboard.id, updates);
              }}
              onToggleLock={() => {
                updateArtboard(artboard.id, { isLocked: !artboard.isLocked });
              }}
              onOpenPageMenu={(pageId, pageName, clientX, clientY) => {
                setContextMenu(null);
                setPageOptionsMenu({
                  x: clientX,
                  y: clientY,
                  pageId,
                  pageName,
                });
              }}
              onShowTooltip={(text, clientX, clientY) => {
                if (!text || clientX === undefined || clientY === undefined) {
                  setCanvasTooltip(null);
                } else {
                  setCanvasTooltip({ text, x: clientX, y: clientY });
                }
              }}
              onContextMenuElement={handleElementContextMenu}
              onArtboardClick={(e) => {
                setContextMenu(null);
                if (artboard.id !== activeArtboardId) {
                  setActivePage(artboard.pageId);
                  setActiveArtboard(artboard.id);
                }
                if (isShapeTool) {
                  const stage = e.target.getStage();
                  const pointer = stage.getPointerPosition();
                  if (pointer) {
                    const worldX = (pointer.x - panX) / zoom;
                    const worldY = (pointer.y - panY) / zoom;
                    handleCreateElementAt(worldX, worldY);
                  }
                } else {
                  clearSelection();
                }
              }}
            />
          ))}
        </Layer>
      </Stage>

      {/* FLOATING BOTTOM-RIGHT QUICK TOOLS CAPSULE matching Reference Image */}
      <div className="absolute right-5 bottom-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-gray-200/90 shadow-lg select-none">
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            activeTool === 'select'
              ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Select Tool (V)"
        >
          <MousePointer2 size={16} strokeWidth={2.2} />
        </button>
        <button
          onClick={() => setActiveTool('hand')}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            activeTool === 'hand'
              ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Pan Workspace (H)"
        >
          <Hand size={16} strokeWidth={2} />
        </button>
        <button
          onClick={() => toggleGrid()}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            showGrid
              ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Toggle Grid & Guides"
        >
          <Grid size={16} strokeWidth={2} />
        </button>
        <button
          onClick={() => {
            if (containerRef.current) {
              fitScreen(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
            } else {
              fitScreen();
            }
          }}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          title="Fit Artboard to Screen"
        >
          <Maximize2 size={16} strokeWidth={2} />
        </button>

        {/* Dedicated Properties & Design Panel Toggle Button */}
        {onToggleProperties && (
          <button
            onClick={onToggleProperties}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isPropertiesOpen
                ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-2xs font-semibold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Toggle Properties & Design Panel"
            aria-label="Toggle Properties & Design Panel"
          >
            <Sliders size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Canvas Context Menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          element={contextMenu.element}
          selectedCount={
            selectedElementIds.includes(contextMenu.element.id) ? selectedElementIds.length : 1
          }
          onSelect={() => {
            setSelectedElements([contextMenu.element.id]);
            setContextMenu(null);
          }}
          onDelete={() => {
            const isTargetSelected = selectedElementIds.includes(contextMenu.element.id);
            const targetIds = isTargetSelected ? selectedElementIds : [contextMenu.element.id];
            // Filter out locked elements
            const allElements: Element[] = [];
            document?.pages.forEach((p) =>
              p.artboards.forEach((ab) => allElements.push(...ab.elements))
            );
            const deletableIds = targetIds.filter((id) => {
              const found = allElements.find((el) => el.id === id);
              return !found?.locked;
            });
            if (deletableIds.length > 0) {
              deleteElements(deletableIds);
            }
            setContextMenu(null);
          }}
          onDuplicate={() => {
            const isTargetSelected = selectedElementIds.includes(contextMenu.element.id);
            const targetIds = isTargetSelected ? selectedElementIds : [contextMenu.element.id];
            duplicateElements(targetIds);
            setContextMenu(null);
          }}
          onBringToFront={() => {
            reorderElement(contextMenu.element.id, 'front');
            setContextMenu(null);
          }}
          onSendToBack={() => {
            reorderElement(contextMenu.element.id, 'back');
            setContextMenu(null);
          }}
          connectorMeta={contextMenu.meta}
          onAddPoint={(pt) => {
            const target = contextMenu.element as any;
            if (target.type !== 'connector' && target.type !== 'flexible-line') return;
            const points = target.points || [];
            let newPt: any;
            if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
              newPt = { id: generateId(), x: pt.x, y: pt.y, isCurved: target.curveMode === 'curved' };
            } else {
              const last = points[points.length - 1] || { x: target.width || 200, y: target.height || 100 };
              const prev = points[points.length - 2] || { x: 0, y: 0 };
              newPt = {
                id: generateId(),
                x: Math.round((prev.x + last.x) / 2),
                y: Math.round((prev.y + last.y) / 2),
                isCurved: target.curveMode === 'curved',
              };
            }
            const updated = [...points];
            if (updated.length >= 2) {
              updated.splice(updated.length - 1, 0, newPt);
            } else {
              updated.push(newPt);
            }
            updateElement(target.id, { points: updated });
          }}
          onEditPoints={() => {
            updateElement(contextMenu.element.id, { editingPoints: true } as any);
            setSelectedElements([contextMenu.element.id]);
          }}
          onConvertToCurve={() => {
            const target = contextMenu.element as any;
            const updatedPoints = (target.points || []).map((p: any) => ({ ...p, isCurved: true }));
            updateElement(target.id, { curveMode: 'curved', points: updatedPoints } as any);
          }}
          onConvertToStraight={() => {
            const target = contextMenu.element as any;
            const updatedPoints = (target.points || []).map((p: any) => ({ ...p, isCurved: false }));
            updateElement(target.id, { curveMode: 'straight', points: updatedPoints } as any);
          }}
          onDeletePoint={(pointIndex) => {
            const target = contextMenu.element as any;
            const points = target.points || [];
            if (points.length <= 2) return;
            let targetIdx = pointIndex;
            if (targetIdx === undefined || targetIdx === 0 || targetIdx === points.length - 1) {
              targetIdx = Math.floor(points.length / 2);
            }
            const updated = points.filter((_: any, idx: number) => idx !== targetIdx);
            updateElement(target.id, { points: updated } as any);
          }}
          onResetLineShape={() => {
            const target = contextMenu.element as any;
            const resetPoints = [
              { id: generateId(), x: 0, y: 0, isCurved: false },
              { id: generateId(), x: target.width || 200, y: target.height || 100, isCurved: false },
            ];
            updateElement(target.id, {
              curveMode: 'straight',
              points: resetPoints,
            } as any);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Section Splitter Tool Modal */}
      <SectionSplitterTool
        isOpen={splitterModalOpen}
        onClose={() => setSplitterModalOpen(false)}
      />

      {/* Page Options Menu (Delete & Reset Page) */}
      {pageOptionsMenu && (
        <PageOptionsMenu
          x={pageOptionsMenu.x}
          y={pageOptionsMenu.y}
          pageId={pageOptionsMenu.pageId}
          pageName={pageOptionsMenu.pageName}
          canDelete={(document?.pages.length || 0) > 1}
          hasElements={(() => {
            const targetPage = document?.pages.find((p) => p.id === pageOptionsMenu.pageId);
            return (targetPage?.artboards.some((ab) => ab.elements.length > 0)) ?? false;
          })()}
          onDelete={(id) => {
            deletePage(id);
            setPageOptionsMenu(null);
          }}
          onReset={(id) => {
            resetPage(id);
            setPageOptionsMenu(null);
          }}
          onClose={() => setPageOptionsMenu(null)}
        />
      )}

      {/* Canvas Tooltip */}
      {canvasTooltip && (
        <div
          style={{
            left: `${canvasTooltip.x}px`,
            top: `${canvasTooltip.y + 16}px`,
            transform: 'translateX(-50%)',
          }}
          className="fixed z-50 pointer-events-none px-2 py-1 bg-gray-900/90 backdrop-blur-xs text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap animate-fade-in select-none"
        >
          {canvasTooltip.text}
        </div>
      )}
    </div>
  );
};

export default EditorCanvas;

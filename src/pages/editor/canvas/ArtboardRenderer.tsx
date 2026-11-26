import React, { useRef, useEffect } from 'react';
import { Group, Rect, Text as KonvaText, Transformer, Shape, Path, Circle } from 'react-konva';
import type { Artboard, Element } from '@/types/document';
import { ElementRenderer } from './ElementRenderer';

interface ArtboardRendererProps {
  artboard: Artboard & { pageId?: string; pageName?: string };
  isActiveScreen?: boolean;
  selectedElementIds: string[];
  activeTool: string;
  showGrid?: boolean;
  gridSize?: number;
  onSelectScreen?: () => void;
  onSelectElement: (elementId: string, isMulti: boolean) => void;
  onUpdateElement: (elementId: string, updates: Partial<Element>) => void;
  onUpdateArtboard?: (updates: Partial<Artboard>) => void;
  onToggleLock?: () => void;
  onArtboardClick: (e: any) => void;
  onContextMenuElement?: (element: Element, clientX: number, clientY: number, meta?: any) => void;
  onOpenPageMenu?: (pageId: string, pageName: string, clientX: number, clientY: number) => void;
  onShowTooltip?: (text: string | null, clientX?: number, clientY?: number) => void;
}

export const ArtboardRenderer: React.FC<ArtboardRendererProps> = ({
  artboard,
  isActiveScreen = true,
  selectedElementIds,
  activeTool,
  showGrid = false,
  gridSize = 20,
  onSelectScreen,
  onSelectElement,
  onUpdateElement,
  onUpdateArtboard,
  onToggleLock,
  onArtboardClick,
  onContextMenuElement,
  onOpenPageMenu,
  onShowTooltip,
}) => {
  const rootGroupRef = useRef<any>(null);
  const badgeRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});
  const transformerRef = useRef<any>(null);

  // Sync position with artboard props across renders/undo/redo
  useEffect(() => {
    if (rootGroupRef.current) {
      rootGroupRef.current.position({ x: artboard.x, y: artboard.y });
      rootGroupRef.current.getLayer()?.batchDraw();
    }
  }, [artboard.x, artboard.y]);

  // Keep transformer attached to selected element nodes (excluding connectors which have their own control point handles)
  useEffect(() => {
    if (transformerRef.current) {
      const selectedNodes = selectedElementIds
        .filter((id) => {
          const el = artboard.elements.find((e) => e.id === id);
          return el && el.type !== 'connector' && (el as any).type !== 'flexible-line';
        })
        .map((id) => nodeRefs.current[id])
        .filter(Boolean);

      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementIds, artboard.elements]);

  const handleTransformEnd = (elementId: string) => {
    const node = nodeRefs.current[elementId];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset node scale so we update width and height directly
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(8, Math.round(node.width() * scaleX));
    const newHeight = Math.max(8, Math.round(node.height() * scaleY));

    onUpdateElement(elementId, {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: newWidth,
      height: newHeight,
      rotation: Math.round(node.rotation()),
    });
  };

  const handleRootDragEnd = (e: any) => {
    if (e.target === rootGroupRef.current) {
      rootGroupRef.current.draggable(false);
      const stage = e.target.getStage();
      if (stage?.container()) {
        stage.container().style.cursor = 'default';
      }
      const newX = Math.round(rootGroupRef.current.x());
      const newY = Math.round(rootGroupRef.current.y());
      onUpdateArtboard?.({ x: newX, y: newY });
    }
  };

  const getClientCoords = (e: any): { x: number; y: number } => {
    const evt = e.evt;
    if (evt) {
      if ('clientX' in evt && typeof evt.clientX === 'number') {
        return { x: evt.clientX, y: evt.clientY };
      }
      if (evt.touches && evt.touches[0]) {
        return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
      }
      if (evt.changedTouches && evt.changedTouches[0]) {
        return { x: evt.changedTouches[0].clientX, y: evt.changedTouches[0].clientY };
      }
    }
    const pointer = e.target?.getStage()?.getPointerPosition();
    return { x: pointer?.x ?? 0, y: pointer?.y ?? 0 };
  };

  const badgeWidth = Math.max(220, (artboard.name || '').length * 8 + 150);
  const isLocked = !!artboard.isLocked;

  return (
    <Group
      ref={rootGroupRef}
      x={artboard.x}
      y={artboard.y}
      onDragEnd={handleRootDragEnd}
    >
      {/* 1. Artboard Badge: 🖥 Website Screen • 1440 × 900 + Position Lock + Options */}
      <Group
        ref={badgeRef}
        x={0}
        y={-36}
        onMouseDown={(e) => {
          if (isLocked || activeTool !== 'select') return;
          if (rootGroupRef.current) {
            rootGroupRef.current.draggable(true);
            rootGroupRef.current.startDrag();
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'grabbing';
            }
          }
        }}
        onTouchStart={(e) => {
          if (isLocked || activeTool !== 'select') return;
          if (rootGroupRef.current) {
            rootGroupRef.current.draggable(true);
            rootGroupRef.current.startDrag();
          }
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = isLocked ? 'default' : 'grab';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectScreen?.();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelectScreen?.();
        }}
      >
        {/* Pill Background */}
        <Rect
          x={0}
          y={0}
          width={badgeWidth}
          height={26}
          fill={isActiveScreen ? '#EDE9FE' : '#F3F4F6'}
          stroke={isActiveScreen ? '#7C3AED' : '#E5E7EB'}
          strokeWidth={1}
          cornerRadius={6}
          shadowColor="#000000"
          shadowBlur={isActiveScreen ? 6 : 2}
          shadowOpacity={isActiveScreen ? 0.1 : 0.04}
          shadowOffset={{ x: 0, y: 1 }}
        />

        {/* Desktop Screen Icon representation */}
        <Rect
          x={10}
          y={6}
          width={13}
          height={10}
          stroke={isActiveScreen ? '#7C3AED' : '#6B7280'}
          strokeWidth={1.5}
          cornerRadius={1}
        />
        <Rect
          x={14}
          y={16}
          width={5}
          height={2}
          fill={isActiveScreen ? '#7C3AED' : '#6B7280'}
        />

        {/* Badge Text */}
        <KonvaText
          x={30}
          y={7}
          text={`${artboard.name}  •  ${artboard.width} × ${artboard.height}`}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fontStyle={isActiveScreen ? '600' : '500'}
          fill={isActiveScreen ? '#6D28D9' : '#4B5563'}
        />

        {/* Lock / Unlock Toggle Button on Badge Header */}
        <Group
          x={badgeWidth - 48}
          y={3}
          onMouseDown={(e) => {
            e.cancelBubble = true;
          }}
          onTouchStart={(e) => {
            e.cancelBubble = true;
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            onToggleLock?.();
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onToggleLock?.();
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'pointer';
            const coords = getClientCoords(e);
            onShowTooltip?.(isLocked ? 'Unlock page' : 'Lock page', coords.x, coords.y);
          }}
          onMouseMove={(e) => {
            const coords = getClientCoords(e);
            onShowTooltip?.(isLocked ? 'Unlock page' : 'Lock page', coords.x, coords.y);
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = isLocked ? 'default' : 'grab';
            onShowTooltip?.(null);
          }}
        >
          <Rect
            x={0}
            y={0}
            width={20}
            height={20}
            fill={isLocked ? '#FEF3C7' : 'transparent'}
            stroke={isLocked ? '#F59E0B' : 'transparent'}
            strokeWidth={1}
            cornerRadius={4}
          />
          {/* Modern Lock/Unlock Icon from Lucide icon paths */}
          {isLocked ? (
            <Path
              x={4}
              y={3.5}
              data="M7 11V7a5 5 0 0 1 10 0v4 M3 11h18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
              stroke="#D97706"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
              scale={{ x: 0.5, y: 0.5 }}
            />
          ) : (
            <Path
              x={4}
              y={3.5}
              data="M7 11V7a5 5 0 0 1 9.9-1 M3 11h18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
              stroke="#6B7280"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
              scale={{ x: 0.5, y: 0.5 }}
            />
          )}
        </Group>

        {/* 3-Dot Page Options Menu Button */}
        <Group
          x={badgeWidth - 24}
          y={3}
          onMouseDown={(e) => {
            e.cancelBubble = true;
          }}
          onTouchStart={(e) => {
            e.cancelBubble = true;
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            const coords = getClientCoords(e);
            onOpenPageMenu?.(
              artboard.pageId || '',
              artboard.name,
              coords.x,
              coords.y
            );
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            const coords = getClientCoords(e);
            onOpenPageMenu?.(
              artboard.pageId || '',
              artboard.name,
              coords.x,
              coords.y
            );
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'pointer';
            const coords = getClientCoords(e);
            onShowTooltip?.('Page options', coords.x, coords.y);
          }}
          onMouseMove={(e) => {
            const coords = getClientCoords(e);
            onShowTooltip?.('Page options', coords.x, coords.y);
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = isLocked ? 'default' : 'grab';
            onShowTooltip?.(null);
          }}
        >
          <Rect
            x={0}
            y={0}
            width={20}
            height={20}
            fill="transparent"
            stroke="transparent"
            strokeWidth={1}
            cornerRadius={4}
          />
          {/* Vertical 3 dots */}
          <Circle x={10} y={6} radius={1.4} fill="#6B7280" />
          <Circle x={10} y={10} radius={1.4} fill="#6B7280" />
          <Circle x={10} y={14} radius={1.4} fill="#6B7280" />
        </Group>
      </Group>

      {/* 2. Artboard Canvas Surface */}
      <Rect
        width={artboard.width}
        height={artboard.height}
        fill={artboard.background || '#FFFFFF'}
        stroke={isActiveScreen ? '#7C3AED' : '#E5E7EB'}
        strokeWidth={isActiveScreen ? 1.5 : 1}
        shadowColor="#000000"
        shadowBlur={isActiveScreen ? 24 : 14}
        shadowOpacity={isActiveScreen ? 0.09 : 0.05}
        shadowOffset={{ x: 0, y: 6 }}
        onClick={(e) => {
          onSelectScreen?.();
          onArtboardClick(e);
        }}
        onTap={(e) => {
          onSelectScreen?.();
          onArtboardClick(e);
        }}
      />

      {/* Grid Overlay when showGrid is enabled */}
      {showGrid && (
        <Shape
          listening={false}
          sceneFunc={(context, shape) => {
            const step = gridSize > 0 ? gridSize : 20;
            context.beginPath();
            for (let x = step; x < artboard.width; x += step) {
              context.moveTo(x, 0);
              context.lineTo(x, artboard.height);
            }
            for (let y = step; y < artboard.height; y += step) {
              context.moveTo(0, y);
              context.lineTo(artboard.width, y);
            }
            context.fillStrokeShape(shape);
          }}
          stroke="#E5E7EB"
          strokeWidth={1}
          opacity={0.7}
        />
      )}

      {/* 3. Children Elements */}
      {artboard.elements.map((el) => {
        const isSelected = selectedElementIds.includes(el.id);
        return (
          <ElementRenderer
            key={el.id}
            ref={(node) => {
              if (node) nodeRefs.current[el.id] = node;
              else delete nodeRefs.current[el.id];
            }}
            element={el}
            isSelected={isSelected}
            onSelect={(e) => {
              e.cancelBubble = true;
              onSelectElement(el.id, e.evt?.shiftKey || e.evt?.metaKey || e.evt?.ctrlKey);
            }}
            onChange={(updates) => onUpdateElement(el.id, updates)}
            onContextMenu={(e, meta) => {
              onContextMenuElement?.(el, e.evt?.clientX ?? 0, e.evt?.clientY ?? 0, meta);
            }}
          />
        );
      })}

      {/* 4. Konva Transformer (Figma-grade resize handles and selection box) */}
      <Transformer
        ref={transformerRef}
        borderStroke="#7C3AED"
        borderStrokeWidth={1.5}
        borderDash={[0, 0]}
        anchorStroke="#7C3AED"
        anchorFill="#FFFFFF"
        anchorSize={8}
        anchorCornerRadius={2}
        rotateAnchorOffset={24}
        ignoreStroke={true}
        keepRatio={false}
        onContextMenu={(e: any) => {
          if (e && e.evt) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
          }
          e.cancelBubble = true;
          if (selectedElementIds.length > 0) {
            const target = artboard.elements.find((item) => item.id === selectedElementIds[0]);
            if (target) {
              onContextMenuElement?.(target, e.evt?.clientX ?? 0, e.evt?.clientY ?? 0);
            }
          }
        }}
        enabledAnchors={[
          'top-left',
          'top-center',
          'top-right',
          'middle-right',
          'bottom-right',
          'bottom-center',
          'bottom-left',
          'middle-left',
        ]}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 5 || newBox.height < 5) return oldBox;
          return newBox;
        }}
        onTransformEnd={() => {
          if (selectedElementIds.length === 1) {
            handleTransformEnd(selectedElementIds[0]);
          }
        }}
      />
    </Group>
  );
};

export default ArtboardRenderer;

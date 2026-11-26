import React, { useRef, forwardRef } from 'react';
import { Group, Line, Circle } from 'react-konva';
import type { ConnectorElement, ConnectorPoint } from '@/types/document';
import { generateId } from '@/lib/utils';

export interface ConnectorRendererProps {
  element: ConnectorElement;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onChange: (updates: Partial<ConnectorElement>) => void;
  onContextMenu?: (e: any, meta?: { pointIndex?: number; clickRelX?: number; clickRelY?: number }) => void;
}

export const ConnectorRenderer = forwardRef<any, ConnectorRendererProps>(
  ({ element, isSelected, onSelect, onChange, onContextMenu }, ref) => {
    const lineRef = useRef<any>(null);

    // Ensure at least two valid points exist
    const rawPoints = element.points && element.points.length >= 2
      ? element.points
      : [
          { id: generateId(), x: 0, y: 0, isCurved: false },
          { id: generateId(), x: Math.round((element.width || 200) / 2), y: Math.round((element.height || 100) / 2), isCurved: false },
          { id: generateId(), x: element.width || 200, y: element.height || 100, isCurved: false },
        ];

    const flatPoints = rawPoints.flatMap((p) => [p.x, p.y]);
    const isCurved = element.curveMode === 'curved' || rawPoints.some((p) => p.isCurved);
    const strokeColor = isSelected ? '#7C3AED' : (element.stroke || '#7C3AED');
    const strokeWidth = element.strokeWidth || 2;
    const isDashed = element.lineStyle === 'dashed';

    // Dragging an individual control point
    const handlePointDragMove = (index: number, e: any) => {
      const newX = Math.round(e.target.x());
      const newY = Math.round(e.target.y());
      const updatedPoints = [...rawPoints];
      updatedPoints[index] = { ...updatedPoints[index], x: newX, y: newY };

      // Update line shape immediately in real time
      if (lineRef.current) {
        lineRef.current.points(updatedPoints.flatMap((p) => [p.x, p.y]));
        lineRef.current.getLayer()?.batchDraw();
      }
    };

    const handlePointDragEnd = (index: number, e: any) => {
      const newX = Math.round(e.target.x());
      const newY = Math.round(e.target.y());
      const updatedPoints = [...rawPoints];
      updatedPoints[index] = { ...updatedPoints[index], x: newX, y: newY };

      // Recalculate bounding dimensions
      const xs = updatedPoints.map((p) => p.x);
      const ys = updatedPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      onChange({
        points: updatedPoints,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
      });
    };

    // Add point at midpoint
    const handleAddMidpoint = (afterIndex: number, e: any) => {
      e.cancelBubble = true;
      const p1 = rawPoints[afterIndex];
      const p2 = rawPoints[afterIndex + 1];
      if (!p1 || !p2) return;

      const midX = Math.round((p1.x + p2.x) / 2);
      const midY = Math.round((p1.y + p2.y) / 2);
      const newPt: ConnectorPoint = {
        id: generateId(),
        x: midX,
        y: midY,
        isCurved: element.curveMode === 'curved',
      };

      const updated = [...rawPoints];
      updated.splice(afterIndex + 1, 0, newPt);
      onChange({ points: updated });
    };

    // Right-click handling on line or points
    const handleContextMenu = (e: any, pointIndex?: number) => {
      if (e && e.evt) {
        e.evt.preventDefault();
        e.evt.stopPropagation();
      }
      e.cancelBubble = true;

      // Calculate relative coordinates inside connector group
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      let clickRelX = 0;
      let clickRelY = 0;

      if (pointer) {
        // Adjust for element x/y and stage transform
        const stageX = stage.x();
        const stageY = stage.y();
        const scale = stage.scaleX() || 1;
        const worldX = (pointer.x - stageX) / scale;
        const worldY = (pointer.y - stageY) / scale;
        clickRelX = Math.round(worldX - element.x);
        clickRelY = Math.round(worldY - element.y);
      }

      onContextMenu?.(e, {
        pointIndex,
        clickRelX,
        clickRelY,
      });
    };

    return (
      <Group
        ref={ref}
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
        opacity={(element.opacity ?? 100) / 100}
        draggable={!element.locked}
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={(e) => handleContextMenu(e)}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) return;
          onChange({
            x: Math.round(e.target.x()),
            y: Math.round(e.target.y()),
          });
        }}
      >
        {/* Main Vector Line */}
        <Line
          ref={lineRef}
          points={flatPoints}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          dash={isDashed ? [6, 6] : undefined}
          lineCap="round"
          lineJoin="round"
          tension={isCurved ? 0.42 : 0}
          hitStrokeWidth={18}
          shadowColor={isSelected ? '#7C3AED' : undefined}
          shadowBlur={isSelected ? 6 : 0}
          shadowOpacity={0.25}
          onClick={onSelect}
          onTap={onSelect}
          onContextMenu={(e) => handleContextMenu(e)}
        />

        {/* Editable Point Handles & Midpoint Adders when Selected */}
        {isSelected && (
          <Group>
            {/* Midpoint quick-add handles between consecutive points */}
            {!element.locked &&
              rawPoints.map((pt, i) => {
                if (i >= rawPoints.length - 1) return null;
                const nextPt = rawPoints[i + 1];
                const midX = (pt.x + nextPt.x) / 2;
                const midY = (pt.y + nextPt.y) / 2;

                return (
                  <Circle
                    key={`mid-${pt.id}-${nextPt.id}`}
                    x={midX}
                    y={midY}
                    radius={3.5}
                    fill="#EDE9FE"
                    stroke="#7C3AED"
                    strokeWidth={1.5}
                    opacity={0.85}
                    onClick={(e) => handleAddMidpoint(i, e)}
                    onTap={(e) => handleAddMidpoint(i, e)}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'default';
                    }}
                  />
                );
              })}

            {/* Main draggable control points */}
            {rawPoints.map((pt, idx) => {
              const isEndpoint = idx === 0 || idx === rawPoints.length - 1;

              return (
                <Circle
                  key={pt.id || `pt-${idx}`}
                  x={pt.x}
                  y={pt.y}
                  radius={isEndpoint ? 5.5 : 4.5}
                  fill={isEndpoint ? '#7C3AED' : '#FFFFFF'}
                  stroke={isEndpoint ? '#FFFFFF' : '#7C3AED'}
                  strokeWidth={2}
                  draggable={!element.locked}
                  onDragMove={(e) => handlePointDragMove(idx, e)}
                  onDragEnd={(e) => handlePointDragEnd(idx, e)}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect(e);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onSelect(e);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, idx)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'grab';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                  }}
                />
              );
            })}
          </Group>
        )}
      </Group>
    );
  }
);

ConnectorRenderer.displayName = 'ConnectorRenderer';
export default ConnectorRenderer;

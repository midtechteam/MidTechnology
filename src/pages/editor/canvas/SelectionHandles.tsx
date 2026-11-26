import React from 'react';
import { Group, Rect, Circle } from 'react-konva';
import type { Element } from '@/types/document';

interface SelectionHandlesProps {
  element: Element;
  onResize: (x: number, y: number, width: number, height: number) => void;
}

export const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  element,
  onResize,
}) => {
  if (element.locked) return null;

  const handleSize = 8;
  const half = handleSize / 2;
  const { x, y, width, height } = element;

  return (
    <Group>
      {/* Outer Selection Frame */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="#7C3AED"
        strokeWidth={1.5}
        listening={false}
      />

      {/* 4 Corner Handles */}
      {/* Top-Left */}
      <Rect
        x={x - half}
        y={y - half}
        width={handleSize}
        height={handleSize}
        fill="#FFFFFF"
        stroke="#7C3AED"
        strokeWidth={1.5}
      />
      {/* Top-Right */}
      <Rect
        x={x + width - half}
        y={y - half}
        width={handleSize}
        height={handleSize}
        fill="#FFFFFF"
        stroke="#7C3AED"
        strokeWidth={1.5}
      />
      {/* Bottom-Right */}
      <Rect
        x={x + width - half}
        y={y + height - half}
        width={handleSize}
        height={handleSize}
        fill="#FFFFFF"
        stroke="#7C3AED"
        strokeWidth={1.5}
      />
      {/* Bottom-Left */}
      <Rect
        x={x - half}
        y={y + height - half}
        width={handleSize}
        height={handleSize}
        fill="#FFFFFF"
        stroke="#7C3AED"
        strokeWidth={1.5}
      />

      {/* Rotation Handle (top circle) */}
      <Circle
        x={x + width / 2}
        y={y - 20}
        radius={4}
        fill="#FFFFFF"
        stroke="#7C3AED"
        strokeWidth={1.5}
      />
    </Group>
  );
};

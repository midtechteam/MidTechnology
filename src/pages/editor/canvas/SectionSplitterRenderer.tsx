import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import type { SectionSplitterElement } from '@/types/document';

interface SectionSplitterRendererProps {
  element: SectionSplitterElement;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onChange: (updates: Partial<SectionSplitterElement>) => void;
  onContextMenu?: (e: any) => void;
}

export const SectionSplitterRenderer: React.FC<SectionSplitterRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onContextMenu,
}) => {
  const { width, height, splitDirection, sections = [], spacing = 8, fill, stroke, strokeWidth, cornerRadius } = element;

  const totalProportion = sections.reduce((acc, s) => acc + (s.proportion || 1), 0) || 1;
  const isHorizontal = splitDirection === 'horizontal';
  const totalSpacing = spacing * Math.max(0, sections.length - 1);
  const availableSpace = (isHorizontal ? width : height) - totalSpacing;

  let currentOffset = 0;

  return (
    <Group
      x={element.x}
      y={element.y}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onContextMenu={(e: any) => {
        if (e && e.evt) {
          e.evt.preventDefault();
          e.evt.stopPropagation();
        }
        e.cancelBubble = true;
        onContextMenu?.(e);
      }}
      onDragEnd={(e) => {
        onChange({
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
      }}
    >
      {/* Background Container Box */}
      <Rect
        width={width}
        height={height}
        fill={fill || '#FFFFFF'}
        stroke={isSelected ? '#7C3AED' : (stroke || '#E5E7EB')}
        strokeWidth={isSelected ? 2 : (strokeWidth ?? 1)}
        cornerRadius={typeof cornerRadius === 'number' ? cornerRadius : 8}
        shadowColor={isSelected ? '#7C3AED' : undefined}
        shadowBlur={isSelected ? 6 : 0}
        shadowOpacity={0.2}
      />

      {/* Render Divided Sections */}
      {sections.map((section, idx) => {
        const secDimension = (section.proportion / totalProportion) * availableSpace;
        const x = isHorizontal ? currentOffset : 0;
        const y = isHorizontal ? 0 : currentOffset;
        const secW = isHorizontal ? secDimension : width;
        const secH = isHorizontal ? height : secDimension;

        currentOffset += secDimension + spacing;

        return (
          <Group key={section.id || idx} x={x} y={y}>
            <Rect
              width={secW}
              height={secH}
              fill={section.background || (idx % 2 === 0 ? '#FAFAFA' : '#F4F4F5')}
              stroke="#E4E4E7"
              strokeWidth={1}
              cornerRadius={4}
            />
            {/* Section Index Indicator */}
            <Text
              x={8}
              y={8}
              text={`Section ${idx + 1}`}
              fontSize={11}
              fontFamily="Inter, sans-serif"
              fill="#A1A1AA"
            />
          </Group>
        );
      })}

      {/* Selection Border Indicator if selected */}
      {isSelected && (
        <Rect
          width={width}
          height={height}
          stroke="#7C3AED"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
};

import React, { forwardRef } from 'react';
import { Rect, Ellipse, Text as KonvaText, Line, Arrow, Group } from 'react-konva';
import type { Element, SectionSplitterElement, ConnectorElement } from '@/types/document';
import { SectionSplitterRenderer } from './SectionSplitterRenderer';
import { ConnectorRenderer } from './ConnectorRenderer';

interface ElementRendererProps {
  element: Element;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onChange: (updates: Partial<Element>) => void;
  onContextMenu?: (e: any, meta?: any) => void;
}

export const ElementRenderer = forwardRef<any, ElementRendererProps>(
  ({ element, isSelected, onSelect, onChange, onContextMenu }, ref) => {
    if (!element.visible) return null;

    const commonProps = {
      ref,
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      opacity: (element.opacity ?? 100) / 100,
      draggable: !element.locked,
      onClick: onSelect,
      onTap: onSelect,
      onContextMenu: (e: any) => {
        if (e && e.evt) {
          e.evt.preventDefault();
          e.evt.stopPropagation();
        }
        e.cancelBubble = true;
        onContextMenu?.(e);
      },
      onDragEnd: (e: any) => {
        onChange({
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
      },
    };

    switch (element.type) {
      case 'rect':
      case 'container':
      case 'frame': {
        const cornerRad =
          typeof element.cornerRadius === 'number'
            ? element.cornerRadius
            : (element as any).type === 'rounded-rect'
            ? 8
            : 0;

        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
            fill={element.fill || '#FFFFFF'}
            stroke={isSelected ? '#7C3AED' : (element.stroke || '#E5E7EB')}
            strokeWidth={isSelected ? 1.5 : (element.strokeWidth ?? 1)}
            cornerRadius={cornerRad}
            shadowColor={isSelected ? '#7C3AED' : '#000000'}
            shadowBlur={isSelected ? 4 : 0}
            shadowOpacity={isSelected ? 0.2 : 0}
          />
        );
      }

      case 'ellipse': {
        const radiusX = Math.max(1, element.width / 2);
        const radiusY = Math.max(1, element.height / 2);
        return (
          <Ellipse
            {...commonProps}
            x={element.x + radiusX}
            y={element.y + radiusY}
            radiusX={radiusX}
            radiusY={radiusY}
            fill={element.fill || '#FFFFFF'}
            stroke={isSelected ? '#7C3AED' : (element.stroke || '#E5E7EB')}
            strokeWidth={isSelected ? 1.5 : (element.strokeWidth ?? 1)}
            shadowColor={isSelected ? '#7C3AED' : undefined}
            shadowBlur={isSelected ? 4 : 0}
            shadowOpacity={0.2}
            onDragEnd={(e: any) => {
              // Adjust for center origin of Ellipse
              onChange({
                x: Math.round(e.target.x() - radiusX),
                y: Math.round(e.target.y() - radiusY),
              });
            }}
          />
        );
      }

      case 'triangle': {
        return (
          <Line
            {...commonProps}
            points={[
              element.width / 2, 0,
              element.width, element.height,
              0, element.height,
            ]}
            closed={true}
            fill={element.fill || '#EDE9FE'}
            stroke={isSelected ? '#7C3AED' : (element.stroke || '#7C3AED')}
            strokeWidth={isSelected ? 2 : (element.strokeWidth ?? 1)}
            shadowColor={isSelected ? '#7C3AED' : undefined}
            shadowBlur={isSelected ? 4 : 0}
            shadowOpacity={0.2}
          />
        );
      }

      case 'text': {
        const textEl = element as any;
        return (
          <KonvaText
            {...commonProps}
            width={element.width}
            text={textEl.content || 'Text element'}
            fontSize={textEl.fontSize || 16}
            fontFamily={textEl.fontFamily || 'Inter, sans-serif'}
            fontStyle={textEl.fontWeight || 'normal'}
            align={textEl.textAlign || 'left'}
            fill={typeof element.fill === 'string' && element.fill !== '#FFFFFF' ? element.fill : '#111827'}
          />
        );
      }

      case 'line': {
        return (
          <Line
            {...commonProps}
            points={[0, 0, element.width, element.height]}
            stroke={isSelected ? '#7C3AED' : (element.stroke || '#111827')}
            strokeWidth={element.strokeWidth || 2}
          />
        );
      }

      case 'arrow': {
        return (
          <Arrow
            {...commonProps}
            points={[0, 0, element.width, element.height]}
            pointerLength={10}
            pointerWidth={8}
            fill={isSelected ? '#7C3AED' : (element.stroke || '#111827')}
            stroke={isSelected ? '#7C3AED' : (element.stroke || '#111827')}
            strokeWidth={element.strokeWidth || 2}
          />
        );
      }

      case 'image': {
        return (
          <Group {...commonProps}>
            <Rect
              width={element.width}
              height={element.height}
              fill="#F9FAFB"
              stroke={isSelected ? '#7C3AED' : (element.stroke || '#D1D5DB')}
              strokeWidth={isSelected ? 1.5 : (element.strokeWidth ?? 1)}
              cornerRadius={typeof element.cornerRadius === 'number' ? element.cornerRadius : 6}
            />
            {/* Crossed lines placeholder */}
            <Line
              points={[0, 0, element.width, element.height]}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            <Line
              points={[0, element.height, element.width, 0]}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            <KonvaText
              x={0}
              y={element.height / 2 - 8}
              width={element.width}
              text="Image"
              align="center"
              fontSize={12}
              fill="#9CA3AF"
            />
          </Group>
        );
      }

      case 'video' as any: {
        const el = element as any;
        return (
          <Group {...commonProps}>
            <Rect
              width={el.width}
              height={el.height}
              fill="#18181B"
              stroke={isSelected ? '#7C3AED' : (el.stroke || '#27272A')}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={typeof el.cornerRadius === 'number' ? el.cornerRadius : 8}
            />
            {/* Play Button Triangle */}
            <Line
              points={[
                el.width / 2 - 10, el.height / 2 - 14,
                el.width / 2 + 14, el.height / 2,
                el.width / 2 - 10, el.height / 2 + 14,
              ]}
              closed={true}
              fill="#7C3AED"
            />
          </Group>
        );
      }

      case 'sectionSplitter':
      case 'section-splitter' as any: {
        return (
          <SectionSplitterRenderer
            element={element as SectionSplitterElement}
            isSelected={isSelected}
            onSelect={onSelect}
            onChange={onChange}
            onContextMenu={onContextMenu}
          />
        );
      }

      case 'connector':
      case 'flexible-line' as any: {
        return (
          <ConnectorRenderer
            ref={ref}
            element={element as ConnectorElement}
            isSelected={isSelected}
            onSelect={onSelect}
            onChange={onChange}
            onContextMenu={onContextMenu}
          />
        );
      }

      default:
        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
            fill="#F3F4F6"
            stroke={isSelected ? '#7C3AED' : '#D1D5DB'}
            strokeWidth={1}
            cornerRadius={4}
          />
        );
    }
  }
);

ElementRenderer.displayName = 'ElementRenderer';

export default ElementRenderer;

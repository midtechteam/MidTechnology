import React, { useEffect, useRef } from 'react';
import {
  MousePointer2,
  Trash2,
  Copy,
  BringToFront,
  SendToBack,
  PlusCircle,
  Pencil,
  Spline,
  Minus,
  MinusCircle,
  RotateCcw,
} from 'lucide-react';
import type { Element, ConnectorElement } from '@/types/document';

export interface CanvasContextMenuProps {
  x: number;
  y: number;
  element: Element;
  selectedCount?: number;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onClose: () => void;
  onAddPoint?: (point?: { x: number; y: number }) => void;
  onEditPoints?: () => void;
  onConvertToCurve?: () => void;
  onConvertToStraight?: () => void;
  onDeletePoint?: (pointIndex?: number) => void;
  onResetLineShape?: () => void;
  connectorMeta?: {
    pointIndex?: number;
    clickRelX?: number;
    clickRelY?: number;
  };
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  element,
  selectedCount = 1,
  onSelect,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onClose,
  onAddPoint,
  onEditPoints,
  onConvertToCurve,
  onConvertToStraight,
  onDeletePoint,
  onResetLineShape,
  connectorMeta,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isConnector = element.type === 'connector' || (element as any).type === 'flexible-line';
  const connectorEl = isConnector ? (element as unknown as ConnectorElement) : null;
  const isLocked = !!element.locked;

  // Viewport boundary clamping: keep context menu within visible screen
  const menuWidth = 200;
  const menuHeight = isConnector ? 360 : 210;
  const clampedX = typeof window !== 'undefined'
    ? Math.max(10, Math.min(window.innerWidth - menuWidth - 10, x))
    : x;
  const clampedY = typeof window !== 'undefined'
    ? Math.max(56, Math.min(window.innerHeight - menuHeight - 10, y))
    : y;

  return (
    <div
      ref={menuRef}
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      className="fixed z-50 bg-white/98 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-2xl py-1.5 px-1 min-w-[180px] select-none text-xs text-gray-700 animate-fade-in font-sans"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Target Element Header */}
      <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 border-b border-gray-100 flex items-center justify-between">
        <span className="truncate max-w-[130px]">{element.name || 'Element'}</span>
        {selectedCount > 1 && (
          <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-mono font-medium">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="py-1 space-y-0.5">
        {/* Connector-specific actions */}
        {isConnector && (
          <div className="space-y-0.5 pb-1 mb-1 border-b border-gray-100">
            <div className="px-2.5 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Connector Options
            </div>

            {/* 1. Add Point */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                onAddPoint?.(
                  connectorMeta?.clickRelX !== undefined && connectorMeta?.clickRelY !== undefined
                    ? { x: connectorMeta.clickRelX, y: connectorMeta.clickRelY }
                    : undefined
                );
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Add a control point along the connector"
            >
              <PlusCircle size={13} className="text-purple-600" />
              <span>Add Point</span>
            </button>

            {/* 2. Edit Points */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                onEditPoints?.();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Enable control point editing"
            >
              <Pencil size={13} className="text-purple-600" />
              <span>Edit Points</span>
            </button>

            {/* 3. Convert to Curve */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                onConvertToCurve?.();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Convert segment into smooth curves"
            >
              <Spline size={13} className="text-purple-600" />
              <span>Convert to Curve</span>
            </button>

            {/* 4. Convert to Straight */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                onConvertToStraight?.();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Convert curved segments into straight lines"
            >
              <Minus size={13} className="text-gray-500" />
              <span>Convert to Straight</span>
            </button>

            {/* 5. Delete Point */}
            <button
              type="button"
              disabled={isLocked || (connectorEl?.points?.length ?? 0) <= 2}
              onClick={() => {
                onDeletePoint?.(connectorMeta?.pointIndex);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={(connectorEl?.points?.length ?? 0) <= 2 ? 'Minimum 2 points required' : 'Remove control point'}
            >
              <MinusCircle size={13} className="text-rose-500" />
              <span>Delete Point</span>
            </button>

            {/* 6. Reset Line Shape */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                onResetLineShape?.();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Restore default straight geometry"
            >
              <RotateCcw size={13} className="text-amber-600" />
              <span>Reset Line Shape</span>
            </button>
          </div>
        )}

        {/* Select */}
        <button
          type="button"
          onClick={() => {
            onSelect();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer"
        >
          <MousePointer2 size={13} className="text-gray-500" />
          <span>Select</span>
        </button>

        {/* Duplicate */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title={isLocked ? 'Locked element cannot be duplicated' : 'Duplicate element'}
        >
          <div className="flex items-center gap-2">
            <Copy size={13} className="text-gray-500" />
            <span>Duplicate</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">Ctrl+D</span>
        </button>

        {/* Bring to Front */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            onBringToFront();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title={isLocked ? 'Locked element cannot be reordered' : 'Bring element to front'}
        >
          <BringToFront size={13} className="text-gray-500" />
          <span>Bring to Front</span>
        </button>

        {/* Send to Back */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            onSendToBack();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title={isLocked ? 'Locked element cannot be reordered' : 'Send element to back'}
        >
          <SendToBack size={13} className="text-gray-500" />
          <span>Send to Back</span>
        </button>

        <div className="h-px bg-gray-100 my-1" />

        {/* Delete */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          title={isLocked ? 'Locked element cannot be deleted' : 'Delete element'}
        >
          <div className="flex items-center gap-2">
            <Trash2 size={13} />
            <span>{isConnector ? 'Delete Line' : 'Delete'}</span>
          </div>
          <span className="text-[10px] text-rose-400 font-mono">Del</span>
        </button>
      </div>
    </div>
  );
};

export default CanvasContextMenu;

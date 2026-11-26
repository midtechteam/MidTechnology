import React from 'react';
import { GripVertical, Minus, Square, X } from 'lucide-react';

export interface FloatingPanelProps {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  zIndex: number;
  width?: number;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onMinimizeToggle: () => void;
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
  headerExtras?: React.ReactNode;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  title,
  isOpen,
  isMinimized,
  position,
  zIndex,
  width = 250,
  onPositionChange,
  onMinimizeToggle,
  onClose,
  onFocus,
  children,
  headerExtras,
}) => {
  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, [data-no-drag]')) {
      return;
    }
    e.preventDefault();
    onFocus();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = position.x;
    const initialY = position.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const clampedX = Math.max(10, Math.min(window.innerWidth - width - 10, initialX + dx));
      const clampedY = Math.max(56, Math.min(window.innerHeight - 50, initialY + dy));
      onPositionChange({ x: clampedX, y: clampedY });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, [data-no-drag]')) {
      return;
    }
    onFocus();
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const initialX = position.x;
    const initialY = position.y;

    const onTouchMove = (moveEvent: TouchEvent) => {
      const t = moveEvent.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const clampedX = Math.max(10, Math.min(window.innerWidth - width - 10, initialX + dx));
      const clampedY = Math.max(56, Math.min(window.innerHeight - 50, initialY + dy));
      onPositionChange({ x: clampedX, y: clampedY });
    };

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  // Safe clamped render coordinates
  const safeX = typeof window !== 'undefined'
    ? Math.max(10, Math.min(window.innerWidth - width - 10, position.x))
    : position.x;
  const safeY = typeof window !== 'undefined'
    ? Math.max(56, Math.min(window.innerHeight - 50, position.y))
    : position.y;

  return (
    <div
      onMouseDown={onFocus}
      style={{
        left: `${safeX}px`,
        top: `${safeY}px`,
        width: `${width}px`,
        zIndex,
      }}
      className="fixed bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden select-none flex flex-col transition-[box-shadow] animate-fade-in"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="px-2.5 py-1.5 bg-gray-50/90 border-b border-gray-200/80 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical size={13} className="text-gray-400 shrink-0" />
          <span className="font-bold text-xs text-gray-800 tracking-tight truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {headerExtras}

          {/* Minimize / Restore Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimizeToggle();
            }}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
            title={isMinimized ? 'Expand panel' : 'Minimize panel'}
            aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            {isMinimized ? <Square size={11} /> : <Minus size={11} />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Close panel"
            aria-label="Close panel"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-170px)]">
          {children}
        </div>
      )}
    </div>
  );
};

export default FloatingPanel;

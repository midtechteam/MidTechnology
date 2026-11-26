import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

export interface PageOptionsMenuProps {
  x: number;
  y: number;
  pageId: string;
  pageName: string;
  canDelete: boolean;
  hasElements: boolean;
  onDelete: (pageId: string) => void;
  onReset: (pageId: string) => void;
  onClose: () => void;
}

export const PageOptionsMenu: React.FC<PageOptionsMenuProps> = ({
  x,
  y,
  pageId,
  pageName,
  canDelete,
  hasElements,
  onDelete,
  onReset,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmMode, setConfirmMode] = useState<'none' | 'delete' | 'reset'>('none');

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

  // Viewport boundary clamping
  const menuWidth = 200;
  const menuHeight = confirmMode !== 'none' ? 140 : 120;
  const clampedX = typeof window !== 'undefined'
    ? Math.max(10, Math.min(window.innerWidth - menuWidth - 10, x))
    : x;
  const clampedY = typeof window !== 'undefined'
    ? Math.max(56, Math.min(window.innerHeight - menuHeight - 10, y))
    : y;

  const handleResetClick = () => {
    if (hasElements) {
      setConfirmMode('reset');
    } else {
      onReset(pageId);
      onClose();
    }
  };

  const handleDeleteClick = () => {
    if (!canDelete) return;
    setConfirmMode('delete');
  };

  return (
    <div
      ref={menuRef}
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      className="fixed z-50 bg-white/98 backdrop-blur-md border border-gray-200/90 rounded-xl shadow-xl py-1.5 px-1 min-w-[190px] select-none text-xs text-gray-700 font-sans"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {confirmMode === 'none' && (
        <>
          {/* Header */}
          <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 border-b border-gray-100 flex items-center justify-between">
            <span className="truncate max-w-[160px]">{pageName || 'Page Options'}</span>
          </div>

          <div className="py-1 space-y-0.5">
            {/* Reset Page */}
            <button
              type="button"
              onClick={handleResetClick}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer group"
            >
              <RotateCcw size={14} className="text-gray-500 group-hover:text-gray-700" />
              <span>Reset Page</span>
            </button>

            {/* Delete Page */}
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={!canDelete}
              title={!canDelete ? 'At least one page is required' : undefined}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                canDelete
                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer group'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trash2
                  size={14}
                  className={canDelete ? 'text-red-500 group-hover:text-red-600' : 'text-gray-300'}
                />
                <span>Delete Page</span>
              </span>
              {!canDelete && (
                <span className="text-[10px] text-gray-400 font-normal">Min 1</span>
              )}
            </button>
          </div>
        </>
      )}

      {/* Confirmation State for Reset */}
      {confirmMode === 'reset' && (
        <div className="p-2 space-y-2">
          <div className="flex items-start gap-1.5 text-amber-600">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight text-gray-700 font-medium">
              Clear all elements on this page?
            </div>
          </div>
          <p className="text-[10px] text-gray-500">
            This will reset the page to a blank canvas.
          </p>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setConfirmMode('none')}
              className="px-2 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onReset(pageId);
                onClose();
              }}
              className="px-2 py-1 text-[11px] rounded bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Confirmation State for Delete */}
      {confirmMode === 'delete' && (
        <div className="p-2 space-y-2">
          <div className="flex items-start gap-1.5 text-red-600">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight text-gray-700 font-medium">
              Delete page "{pageName}"?
            </div>
          </div>
          <p className="text-[10px] text-gray-500">
            All elements and artboards on this page will be removed.
          </p>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setConfirmMode('none')}
              className="px-2 py-1 text-[11px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(pageId);
                onClose();
              }}
              className="px-2 py-1 text-[11px] rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

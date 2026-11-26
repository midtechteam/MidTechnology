import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';
import { useUIStore } from '@/stores/uiStore';
import {
  ArrowLeft,
  Eye,
  Share2,
  ChevronRight,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  Pencil,
  Maximize2,
  Download,
  MoreVertical,
} from 'lucide-react';

type ExportFormat = 'PNG' | 'SVG' | 'HTML' | 'React' | 'Prompt';

interface EditorTopBarProps {
  onOpenPreview?: () => void;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({ onOpenPreview }) => {
  const navigate = useNavigate();
  const {
    projectName,
    setProjectName,
    saveStatus,
    isDirty,
    saveToIndexedDB,
    saveToSupabase,
    setSaveStatus,
    zoom,
    setZoom,
    fitScreen,
    undo,
    redo,
    canUndo,
    canRedo,
    exportAs,
  } = useEditorStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [exportSubmenuOpen, setExportSubmenuOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [saveExitError, setSaveExitError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInput(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
        setExportSubmenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (overflowOpen) {
          setOverflowOpen(false);
          setExportSubmenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [overflowOpen]);

  const handleNameCommit = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setProjectName(trimmed);
    else setNameInput(projectName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameCommit();
    if (e.key === 'Escape') {
      setNameInput(projectName);
      setIsEditingName(false);
    }
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 4));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.1));

  const handleExport = (format: ExportFormat) => {
    setOverflowOpen(false);
    setExportSubmenuOpen(false);
    exportAs(format);
  };

  const handleBackClick = () => {
    if (isDirty) {
      setSaveExitError(null);
      setShowExitConfirm(true);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSaveAndExit = async () => {
    if (isSavingAndExiting) return;
    setIsSavingAndExiting(true);
    setSaveExitError(null);
    setSaveStatus('saving');

    try {
      await saveToIndexedDB();
      await saveToSupabase();
      setSaveStatus('saved');
      setIsSavingAndExiting(false);
      setShowExitConfirm(false);
      navigate('/dashboard');
    } catch (e: any) {
      console.error('Save failed before exit', e);
      const errMsg = e?.message || 'Failed to save wireframe. Please try again.';
      setSaveExitError(errMsg);
      setSaveStatus('error');
      setIsSavingAndExiting(false);
      useUIStore.getState().showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save your changes. Your wireframe has been kept intact in the editor.',
      });
    }
  };

  const handleDiscardAndExit = () => {
    if (isSavingAndExiting) return;
    setShowExitConfirm(false);
    navigate('/dashboard');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setShareCopied(true);
    setTimeout(() => {
      setShareCopied(false);
      setOverflowOpen(false);
    }, 1500);
  };

  const saveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]/60">
            <Check size={12} strokeWidth={2.5} />
            Saved
          </span>
        );
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <Loader2 size={12} className="animate-spin text-amber-600" />
            Saving...
          </span>
        );
      case 'unsaved':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
            <AlertCircle size={12} />
            Unsaved
          </span>
        );
      default:
        return null;
    }
  };

  const exportFormats: ExportFormat[] = ['PNG', 'SVG', 'HTML', 'React', 'Prompt'];

  return (
    <>
      <header className="flex items-center justify-between h-[52px] px-3.5 bg-white border-b border-gray-200/90 shrink-0 z-40 select-none shadow-2xs">
        {/* LEFT: Back arrow, editable title with pencil, save status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleBackClick}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-1.5 group max-w-[280px]">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameCommit}
                onKeyDown={handleNameKeyDown}
                className="bg-white text-gray-900 text-sm font-semibold px-2 py-0.5 rounded-md border border-purple-500 ring-2 ring-purple-100 outline-none w-full"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-gray-100 text-left transition-colors cursor-pointer"
                title="Click to rename"
              >
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {projectName || 'New Wireframe'}
                </span>
                <Pencil size={12} className="text-gray-400 group-hover:text-purple-600 transition-colors shrink-0" />
              </button>
            )}
          </div>

          <div className="ml-1 shrink-0">{saveStatusDisplay()}</div>
        </div>

        {/* CENTER: Undo, Redo, Zoom Controls, Fit Screen */}
        <div className="flex items-center gap-1 bg-gray-50/80 px-1.5 py-1 rounded-xl border border-gray-200/70">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus size={13} />
          </button>

          <button
            onClick={() => fitScreen()}
            className="text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-white px-2 py-1 rounded-md min-w-[50px] text-center transition-colors font-mono cursor-pointer"
            title="Fit to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus size={13} />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-0.5" />

          <button
            onClick={() => fitScreen()}
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer"
            title="Fit to screen"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* RIGHT: Preview and modern 3-dot overflow menu (Share & Export) */}
        <div className="flex items-center gap-2">
          {/* Preview Button (Preserved) */}
          <button
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer shadow-2xs"
            title="Preview wireframe"
          >
            <Eye size={14} className="text-gray-500" />
            <span>Preview</span>
          </button>

          {/* Modern 3-Dot Vertical Overflow Menu (⋮) */}
          <div ref={overflowMenuRef} className="relative">
            <button
              onClick={() => {
                setOverflowOpen((v) => !v);
                setExportSubmenuOpen(false);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                overflowOpen
                  ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-100 shadow-2xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-2xs'
              }`}
              title="More actions (Share, Export)"
              aria-label="More actions"
              aria-haspopup="true"
              aria-expanded={overflowOpen}
            >
              <MoreVertical size={16} />
            </button>

            {overflowOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[210px] animate-fade-in"
                role="menu"
              >
                {/* Share Option */}
                <button
                  onClick={handleShare}
                  className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:text-purple-700 hover:bg-purple-50/70 transition-colors flex items-center justify-between cursor-pointer"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    {shareCopied ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Share2 size={14} className="text-gray-500" />
                    )}
                    <span className="font-medium">
                      {shareCopied ? 'Link Copied!' : 'Share Wireframe'}
                    </span>
                  </div>
                  {shareCopied && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                      Copied
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1" />

                {/* Export Option with sub-menu */}
                <div>
                  <button
                    onClick={() => setExportSubmenuOpen((v) => !v)}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      exportSubmenuOpen
                        ? 'text-purple-700 bg-purple-50/50 font-medium'
                        : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50/70'
                    }`}
                    role="menuitem"
                    aria-expanded={exportSubmenuOpen}
                  >
                    <div className="flex items-center gap-2.5">
                      <Download size={14} className="text-gray-500" />
                      <span className="font-medium">Export</span>
                    </div>
                    <ChevronRight
                      size={13}
                      className={`text-gray-400 transition-transform duration-150 ${
                        exportSubmenuOpen ? 'rotate-90 text-purple-600' : ''
                      }`}
                    />
                  </button>

                  {exportSubmenuOpen && (
                    <div className="bg-gray-50/80 border-t border-b border-gray-100 py-1 px-1 my-0.5 space-y-0.5">
                      <div className="px-2.5 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Available Formats
                      </div>
                      {exportFormats.map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => handleExport(fmt)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-700 hover:text-purple-600 hover:bg-white hover:shadow-2xs transition-all flex items-center justify-between cursor-pointer"
                          role="menuitem"
                        >
                          <span>Export as {fmt}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            .{fmt.toLowerCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Dialog on Back with Unsaved Changes */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Unsaved Changes</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              You have unsaved changes in your wireframe. Do you want to save before leaving?
            </p>

            {saveExitError && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{saveExitError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={isSavingAndExiting}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium text-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingAndExiting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving and returning...</span>
                  </>
                ) : (
                  <span>Save and Return to Dashboard</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleDiscardAndExit}
                disabled={isSavingAndExiting}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium text-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSavingAndExiting) {
                    setShowExitConfirm(false);
                    setSaveExitError(null);
                  }
                }}
                disabled={isSavingAndExiting}
                className="w-full py-1.5 px-3 rounded-xl text-gray-500 hover:text-gray-700 disabled:opacity-50 text-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorTopBar;

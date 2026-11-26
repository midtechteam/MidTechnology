import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Monitor,
  Expand,
  Shrink,
} from 'lucide-react';
import { exportToSVG } from '@/lib/exporters/imageExporter';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose }) => {
  const { document, activeArtboardId, activePageId } = useEditorStore();
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const page = document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
  const artboard =
    page?.artboards.find((ab) => ab.id === activeArtboardId) || page?.artboards[0];

  const calculateFitScale = useCallback(() => {
    if (!previewAreaRef.current || !artboard) return 1.0;
    const padding = 80;
    const availableW = Math.max(200, previewAreaRef.current.clientWidth - padding);
    const availableH = Math.max(200, previewAreaRef.current.clientHeight - padding);
    const scaleW = availableW / artboard.width;
    const scaleH = availableH / artboard.height;
    const fit = Math.min(1.0, Math.max(0.15, Number(Math.min(scaleW, scaleH).toFixed(2))));
    return fit;
  }, [artboard]);

  // Set initial fit zoom on open
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow container to measure layout
      const timer = setTimeout(() => {
        const fit = calculateFitScale();
        setZoomScale(fit);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, calculateFitScale]);

  // Keyboard navigation: Escape to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (window.document.fullscreenElement) {
          window.document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };
    window.document.addEventListener('fullscreenchange', handleFsChange);
    return () => window.document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!window.document.fullscreenElement) {
        if (modalContainerRef.current?.requestFullscreen) {
          await modalContainerRef.current.requestFullscreen();
        }
      } else {
        await window.document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleFitScreen = () => {
    setZoomScale(calculateFitScale());
  };

  if (!isOpen || !document) return null;

  const svgContent = exportToSVG(document, artboard?.id, activePageId || page?.id);

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0F172A] text-white select-none animate-fade-in"
    >
      {/* Modern Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#1E293B]/95 backdrop-blur-md border-b border-gray-700/60 shrink-0 z-20 shadow-md">
        {/* Left: Project / Page / Artboard Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <Monitor size={13} className="text-purple-400" />
            <span>Preview Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-100">
              {page?.name || 'Page 1'}
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-xs text-gray-300 font-medium">
              {artboard?.name || 'Screen'}
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
            {artboard?.width} × {artboard?.height} px
          </span>
        </div>

        {/* Right: Modern Zoom Controls, Fullscreen & Close */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-gray-800/90 rounded-lg p-0.5 border border-gray-700/70">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.15, Number((s - 0.1).toFixed(2))))}
              className="p-1.5 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-xs font-mono text-gray-200 min-w-[50px] text-center select-none font-medium">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(3.0, Number((s + 0.1).toFixed(2))))}
              className="p-1.5 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Reset Zoom to 100% */}
          <button
            onClick={() => setZoomScale(1.0)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/70 text-xs font-medium transition-colors cursor-pointer"
            title="Reset Zoom (100%)"
          >
            <RotateCcw size={13} />
            <span>100%</span>
          </button>

          {/* Fit to screen */}
          <button
            onClick={handleFitScreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/70 text-xs font-medium transition-colors cursor-pointer"
            title="Fit Artboard to Screen"
          >
            <Expand size={13} />
            <span>Fit Screen</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/70 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Shrink size={15} /> : <Maximize2 size={15} />}
          </button>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Close Preview Action */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-all text-xs font-semibold cursor-pointer shadow-sm"
            title="Close Preview (Esc)"
          >
            <X size={15} />
            <span>Close Preview</span>
          </button>
        </div>
      </div>

      {/* Main Preview Workspace on Sleek Dark Neutral Backdrop */}
      <div
        ref={previewAreaRef}
        className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#0B0F19]"
      >
        <div
          className="bg-white rounded-xl shadow-2xl overflow-hidden transition-transform duration-100 ease-out border border-gray-700/40 shrink-0"
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'center center',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
};

export default PreviewModal;

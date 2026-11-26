import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/stores/editorStore';
import { EditorTopBar } from './EditorTopBar';
import { EditorLeftPanel } from './panels/EditorLeftPanel';
import { EditorCanvas } from './canvas/EditorCanvas';
import { EditorRightPanel } from './panels/EditorRightPanel';
import { EditorBottomBar } from './EditorBottomBar';
import { PreviewModal } from './PreviewModal';
import { FloatingPanel } from './panels/FloatingPanel';
import { ToolsPalette } from './panels/ToolsPalette';
import { LayersPanel } from './panels/LayersPanel';
import { ComponentsLibrary } from './panels/ComponentsLibrary';
import { useFloatingPanels } from './panels/useFloatingPanels';

const AUTOSAVE_DELAY = 2000;

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    panels,
    focusPanel,
    openPanel,
    closePanel,
    togglePanel,
    toggleMinimize,
    updatePosition,
  } = useFloatingPanels();

  const [propertiesTab, setPropertiesTab] = useState<'properties' | 'design'>('properties');

  const {
    loadProject,
    undo,
    redo,
    copySelected,
    pasteElements,
    duplicateSelected,
    deleteSelected,
    clearSelection,
    setActiveTool,
    activeTool,
    saveToIndexedDB,
    saveToSupabase,
    isDirty,
    setSaveStatus,
  } = useEditorStore();

  const [previewOpen, setPreviewOpen] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spaceHeldRef = useRef(false);

  // Load project on mount
  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
      return;
    }
    loadProject(projectId);
  }, [projectId, loadProject, navigate]);

  // Autosave whenever isDirty changes
  useEffect(() => {
    if (!isDirty) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveToIndexedDB();
        await saveToSupabase();
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('unsaved');
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [isDirty, saveToIndexedDB, saveToSupabase, setSaveStatus]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.code === 'Space' && !isEditing) {
        e.preventDefault();
        spaceHeldRef.current = true;
        setActiveTool('hand');
      }

      if (isEditing) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            copySelected();
            break;
          case 'v':
            e.preventDefault();
            pasteElements();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelected();
            break;
          default:
            break;
        }
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          deleteSelected();
          break;
        case 'Escape':
          clearSelection();
          break;
        case 'v':
        case 'V':
          setActiveTool('select');
          break;
        case 'h':
        case 'H':
          setActiveTool('hand');
          break;
        case 'f':
        case 'F':
          setActiveTool('frame');
          break;
        case 'r':
        case 'R':
          setActiveTool('rect');
          break;
        case 'o':
        case 'O':
          setActiveTool('ellipse');
          break;
        case 'l':
        case 'L':
          setActiveTool('line');
          break;
        case 't':
        case 'T':
          setActiveTool('text');
          break;
        case 's':
        case 'S':
          setActiveTool('section-splitter');
          break;
        default:
          break;
      }
    },
    [
      undo,
      redo,
      copySelected,
      pasteElements,
      duplicateSelected,
      deleteSelected,
      clearSelection,
      setActiveTool,
    ]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        // Restore previous tool
        if (activeTool === 'hand') {
          setActiveTool('select');
        }
      }
    },
    [activeTool, setActiveTool]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-white text-gray-900 select-none">
      {/* Top Bar matching Reference Image */}
      <EditorTopBar onOpenPreview={() => setPreviewOpen(true)} />

      {/* Main Workspace (Canvas takes full width, Floating Left Toolbar & Movable Floating Panels float above) */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Full workspace canvas */}
        <EditorCanvas
          onToggleProperties={() => togglePanel('properties')}
          isPropertiesOpen={panels.properties.isOpen}
        />

        {/* Modern Floating Left Toolbar with Cascading Menus */}
        <EditorLeftPanel
          onTogglePanel={togglePanel}
          onOpenPanel={openPanel}
          openPanels={{
            tools: panels.tools.isOpen,
            layers: panels.layers.isOpen,
            components: panels.components.isOpen,
            properties: panels.properties.isOpen,
          }}
          onSelectPropertiesTab={setPropertiesTab}
        />

        {/* 1. Movable Floating Tool Panel */}
        <FloatingPanel
          id="tools"
          title="Tool Panel"
          isOpen={panels.tools.isOpen}
          isMinimized={panels.tools.isMinimized}
          position={panels.tools.position}
          zIndex={panels.tools.zIndex}
          width={panels.tools.width}
          onPositionChange={(pos) => updatePosition('tools', pos)}
          onMinimizeToggle={() => toggleMinimize('tools')}
          onClose={() => closePanel('tools')}
          onFocus={() => focusPanel('tools')}
        >
          <ToolsPalette />
        </FloatingPanel>

        {/* 2. Movable Floating Layer Panel */}
        <FloatingPanel
          id="layers"
          title="Layer Panel"
          isOpen={panels.layers.isOpen}
          isMinimized={panels.layers.isMinimized}
          position={panels.layers.position}
          zIndex={panels.layers.zIndex}
          width={panels.layers.width}
          onPositionChange={(pos) => updatePosition('layers', pos)}
          onMinimizeToggle={() => toggleMinimize('layers')}
          onClose={() => closePanel('layers')}
          onFocus={() => focusPanel('layers')}
        >
          <LayersPanel />
        </FloatingPanel>

        {/* 3. Movable Floating Components Library */}
        <FloatingPanel
          id="components"
          title="Components Library"
          isOpen={panels.components.isOpen}
          isMinimized={panels.components.isMinimized}
          position={panels.components.position}
          zIndex={panels.components.zIndex}
          width={panels.components.width}
          onPositionChange={(pos) => updatePosition('components', pos)}
          onMinimizeToggle={() => toggleMinimize('components')}
          onClose={() => closePanel('components')}
          onFocus={() => focusPanel('components')}
        >
          <ComponentsLibrary />
        </FloatingPanel>

        {/* 4. Movable Floating Properties & Design Panel */}
        <EditorRightPanel
          isFloating={true}
          isOpen={panels.properties.isOpen}
          isMinimized={panels.properties.isMinimized}
          position={panels.properties.position}
          zIndex={panels.properties.zIndex}
          width={panels.properties.width}
          onPositionChange={(pos) => updatePosition('properties', pos)}
          onMinimizeToggle={() => toggleMinimize('properties')}
          onClose={() => closePanel('properties')}
          onFocus={() => focusPanel('properties')}
          activeTab={propertiesTab}
          onTabChange={setPropertiesTab}
        />
      </div>

      {/* Bottom Page Bar matching Reference Image */}
      <EditorBottomBar />

      {/* Preview Modal */}
      <PreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
};

export default EditorPage;

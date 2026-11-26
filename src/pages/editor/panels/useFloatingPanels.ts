import { useState, useCallback, useEffect } from 'react';

export type PanelId = 'tools' | 'layers' | 'components' | 'properties';

export interface PanelState {
  id: PanelId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  zIndex: number;
  width: number;
}

const DEFAULT_PANELS: Record<PanelId, PanelState> = {
  properties: {
    id: 'properties',
    title: 'Properties & Design',
    isOpen: true,
    isMinimized: false,
    position: {
      x: typeof window !== 'undefined' ? Math.max(80, window.innerWidth - 270) : 1000,
      y: 64,
    },
    zIndex: 30,
    width: 255,
  },
  tools: {
    id: 'tools',
    title: 'Tool Panel',
    isOpen: false,
    isMinimized: false,
    position: { x: 74, y: 64 },
    zIndex: 31,
    width: 260,
  },
  layers: {
    id: 'layers',
    title: 'Layer Panel',
    isOpen: false,
    isMinimized: false,
    position: { x: 74, y: 110 },
    zIndex: 32,
    width: 250,
  },
  components: {
    id: 'components',
    title: 'Components Library',
    isOpen: false,
    isMinimized: false,
    position: { x: 74, y: 155 },
    zIndex: 33,
    width: 280,
  },
};

const getSafePanelPosition = (
  id: PanelId,
  currentPos: { x: number; y: number },
  width: number
): { x: number; y: number } => {
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  let x = currentPos.x;
  let y = currentPos.y;

  if (id === 'properties') {
    if (x < 10 || x > winW - width - 10) {
      x = Math.max(10, winW - width - 20);
    }
  } else {
    if (x < 10 || x > winW - width - 10) {
      x = 74;
    }
  }

  if (y < 56 || y > winH - 60) {
    y = 64;
  }

  return { x, y };
};

export function useFloatingPanels() {
  const [panels, setPanels] = useState<Record<PanelId, PanelState>>(() => {
    // Deep clone DEFAULT_PANELS so module references are not shared
    const initial: Record<PanelId, PanelState> = {
      properties: { ...DEFAULT_PANELS.properties, position: { ...DEFAULT_PANELS.properties.position } },
      tools: { ...DEFAULT_PANELS.tools, position: { ...DEFAULT_PANELS.tools.position } },
      layers: { ...DEFAULT_PANELS.layers, position: { ...DEFAULT_PANELS.layers.position } },
      components: { ...DEFAULT_PANELS.components, position: { ...DEFAULT_PANELS.components.position } },
    };
    if (typeof window !== 'undefined') {
      initial.properties.position.x = Math.max(80, window.innerWidth - 275);
    }
    return initial;
  });

  const [topZIndex, setTopZIndex] = useState(50);

  const focusPanel = useCallback((id: PanelId) => {
    setTopZIndex((prev) => {
      const nextZ = Math.max(50, prev + 1);
      setPanels((curr) => ({
        ...curr,
        [id]: { ...curr[id], zIndex: nextZ },
      }));
      return nextZ;
    });
  }, []);

  const openPanel = useCallback((id: PanelId) => {
    setTopZIndex((prev) => {
      const nextZ = Math.max(50, prev + 1);
      setPanels((curr) => {
        const p = curr[id];
        const safePos = getSafePanelPosition(id, p.position, p.width);
        return {
          ...curr,
          [id]: {
            ...p,
            isOpen: true,
            isMinimized: false,
            position: safePos,
            zIndex: nextZ,
          },
        };
      });
      return nextZ;
    });
  }, []);

  const closePanel = useCallback((id: PanelId) => {
    setPanels((curr) => ({
      ...curr,
      [id]: { ...curr[id], isOpen: false },
    }));
  }, []);

  const togglePanel = useCallback((id: PanelId) => {
    setTopZIndex((prev) => {
      const nextZ = Math.max(50, prev + 1);
      setPanels((curr) => {
        const p = curr[id];
        if (!p.isOpen) {
          const safePos = getSafePanelPosition(id, p.position, p.width);
          return {
            ...curr,
            [id]: {
              ...p,
              isOpen: true,
              isMinimized: false,
              position: safePos,
              zIndex: nextZ,
            },
          };
        }
        if (p.isMinimized) {
          return {
            ...curr,
            [id]: { ...p, isMinimized: false, zIndex: nextZ },
          };
        }
        // Toggle closed
        return {
          ...curr,
          [id]: { ...p, isOpen: false },
        };
      });
      return nextZ;
    });
  }, []);

  const toggleMinimize = useCallback((id: PanelId) => {
    setPanels((curr) => ({
      ...curr,
      [id]: { ...curr[id], isMinimized: !curr[id].isMinimized },
    }));
  }, []);

  const updatePosition = useCallback((id: PanelId, pos: { x: number; y: number }) => {
    setPanels((curr) => ({
      ...curr,
      [id]: { ...curr[id], position: pos },
    }));
  }, []);

  // Clamp panels to stay inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setPanels((curr) => {
        let changed = false;
        const next = { ...curr };
        (Object.keys(next) as PanelId[]).forEach((key) => {
          const p = next[key];
          const clampedX = Math.max(10, Math.min(window.innerWidth - p.width - 10, p.position.x));
          const clampedY = Math.max(56, Math.min(window.innerHeight - 50, p.position.y));
          if (clampedX !== p.position.x || clampedY !== p.position.y) {
            next[key] = { ...p, position: { x: clampedX, y: clampedY } };
            changed = true;
          }
        });
        return changed ? next : curr;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    panels,
    focusPanel,
    openPanel,
    closePanel,
    togglePanel,
    toggleMinimize,
    updatePosition,
  };
}

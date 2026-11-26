import React from 'react';

interface CanvasRulersProps {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  artboardX: number;
  artboardY: number;
  artboardWidth: number;
  artboardHeight: number;
}

export const CanvasRulers: React.FC<CanvasRulersProps> = ({
  width,
  height,
  zoom,
  panX,
  panY,
  artboardX,
  artboardY,
  artboardWidth,
  artboardHeight,
}) => {
  const RULER_THICKNESS = 20;

  // Major step in artboard coordinates
  const majorStep = zoom < 0.4 ? 400 : zoom < 0.8 ? 200 : 100;
  const minorStep = majorStep / 4;

  // Calculate visible range for horizontal ruler
  const startX = Math.floor((-panX / zoom - artboardX) / minorStep) * minorStep;
  const endX = Math.ceil(((width - panX) / zoom - artboardX) / minorStep) * minorStep;

  // Calculate visible range for vertical ruler
  const startY = Math.floor((-panY / zoom - artboardY) / minorStep) * minorStep;
  const endY = Math.ceil(((height - panY) / zoom - artboardY) / minorStep) * minorStep;

  const hTicks: { pos: number; label?: string; isMajor: boolean }[] = [];
  for (let x = Math.max(-400, startX); x <= Math.min(artboardWidth + 400, endX); x += minorStep) {
    const screenX = panX + (artboardX + x) * zoom;
    if (screenX >= RULER_THICKNESS && screenX <= width) {
      const isMajor = Math.abs(x % majorStep) < 0.001;
      hTicks.push({
        pos: screenX,
        label: isMajor ? `${Math.round(x)}` : undefined,
        isMajor,
      });
    }
  }

  const vTicks: { pos: number; label?: string; isMajor: boolean }[] = [];
  for (let y = Math.max(-400, startY); y <= Math.min(artboardHeight + 400, endY); y += minorStep) {
    const screenY = panY + (artboardY + y) * zoom;
    if (screenY >= RULER_THICKNESS && screenY <= height) {
      const isMajor = Math.abs(y % majorStep) < 0.001;
      vTicks.push({
        pos: screenY,
        label: isMajor ? `${Math.round(y)}` : undefined,
        isMajor,
      });
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-mono text-[9px] text-gray-400">
      {/* Corner Intersection Box */}
      <div
        className="absolute top-0 left-0 bg-[#F8F9FB] border-r border-b border-gray-200/90 z-20"
        style={{ width: RULER_THICKNESS, height: RULER_THICKNESS }}
      />

      {/* TOP HORIZONTAL RULER */}
      <div
        className="absolute top-0 bg-[#F8F9FB]/95 backdrop-blur-2xs border-b border-gray-200/90"
        style={{ left: RULER_THICKNESS, right: 0, height: RULER_THICKNESS }}
      >
        {hTicks.map((tick, i) => (
          <div
            key={`h-${i}`}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${tick.pos - RULER_THICKNESS}px` }}
          >
            {/* Tick Mark */}
            <div
              className={`w-px bg-gray-300 ${
                tick.isMajor ? 'h-2.5 bg-gray-400' : 'h-1.5'
              }`}
            />
            {/* Number Label */}
            {tick.label !== undefined && (
              <span className="text-[9px] text-gray-500 font-medium -translate-x-1/2 mt-0.5 pointer-events-none">
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* LEFT VERTICAL RULER */}
      <div
        className="absolute left-0 bg-[#F8F9FB]/95 backdrop-blur-2xs border-r border-gray-200/90"
        style={{ top: RULER_THICKNESS, bottom: 0, width: RULER_THICKNESS }}
      >
        {vTicks.map((tick, i) => (
          <div
            key={`v-${i}`}
            className="absolute left-0 flex items-center"
            style={{ top: `${tick.pos - RULER_THICKNESS}px` }}
          >
            {/* Tick Mark */}
            <div
              className={`h-px bg-gray-300 ${
                tick.isMajor ? 'w-2.5 bg-gray-400' : 'w-1.5'
              }`}
            />
            {/* Number Label */}
            {tick.label !== undefined && (
              <span className="text-[9px] text-gray-500 font-medium ml-0.5 -translate-y-1/2 pointer-events-none origin-top-left scale-90">
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasRulers;

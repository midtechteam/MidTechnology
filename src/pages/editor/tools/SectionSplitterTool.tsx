import React, { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { SplitSquareHorizontal, SplitSquareVertical, X, Check } from 'lucide-react';
import { generateId } from '@/lib/utils';

interface SectionSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SectionSplitterTool: React.FC<SectionSplitterModalProps> = ({ isOpen, onClose }) => {
  const { document, activeArtboardId, addElement, activePageId } = useEditorStore();

  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [sectionCount, setSectionCount] = useState<number>(3);
  const [spacing, setSpacing] = useState<number>(8);
  const [proportions, setProportions] = useState<number[]>([1, 1, 1]);

  if (!isOpen) return null;

  const page = document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
  const activeArtboard =
    page?.artboards.find((ab) => ab.id === activeArtboardId) || page?.artboards[0];

  const artboardWidth = activeArtboard?.width || 1440;
  const artboardHeight = activeArtboard?.height || 900;

  const handleSectionCountChange = (count: number) => {
    const validCount = Math.max(2, Math.min(8, count));
    setSectionCount(validCount);
    setProportions(Array(validCount).fill(1));
  };

  const handleApply = () => {
    const sections = proportions.slice(0, sectionCount).map((prop, idx) => ({
      id: generateId(),
      proportion: prop,
      background: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
      elements: [],
    }));

    const splitterEl: any = {
      id: generateId(),
      type: 'sectionSplitter',
      name: `Section Splitter (${sectionCount} ${direction})`,
      x: 40,
      y: 40,
      width: Math.min(artboardWidth - 80, 1120),
      height: Math.min(artboardHeight - 80, 600),
      rotation: 0,
      opacity: 100,
      visible: true,
      locked: false,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      cornerRadius: 12,
      splitDirection: direction,
      sections,
      spacing,
    };

    if (activeArtboard) {
      addElement(splitterEl as any, activeArtboard.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-fade-in select-none">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl text-gray-900 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <SplitSquareHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Section Splitter</h3>
              <p className="text-[11px] text-gray-500">Divide workspace into coordinated sections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direction Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Split Direction</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('horizontal')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                direction === 'horizontal'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500 shadow-2xs font-semibold'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SplitSquareHorizontal className="w-4 h-4" /> Columns (Horizontal)
            </button>
            <button
              type="button"
              onClick={() => setDirection('vertical')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                direction === 'vertical'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500 shadow-2xs font-semibold'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" /> Rows (Vertical)
            </button>
          </div>
        </div>

        {/* Section Count */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-gray-700">Number of Sections</label>
            <span className="font-mono text-purple-600 font-bold">{sectionCount}</span>
          </div>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSectionCountChange(num)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  sectionCount === num
                    ? 'border-purple-500 bg-purple-600 text-white shadow-2xs'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Spacing Gap */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-gray-700">Section Gap (px)</label>
            <span className="font-mono text-purple-600 font-medium">{spacing}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            className="w-full accent-purple-600 bg-gray-200 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Live Mini Preview */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-gray-400">Layout Preview</span>
          <div
            className={`w-full h-20 bg-gray-50 border border-gray-200 rounded-xl p-2 flex ${
              direction === 'horizontal' ? 'flex-row' : 'flex-col'
            } gap-1.5 overflow-hidden`}
          >
            {Array.from({ length: sectionCount }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-white border border-purple-200 rounded-lg flex items-center justify-center text-[11px] text-purple-700 font-mono font-medium shadow-2xs"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" /> Apply Splitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionSplitterTool;

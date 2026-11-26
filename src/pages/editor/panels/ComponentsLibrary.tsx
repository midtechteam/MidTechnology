import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { COMPONENT_DEFINITIONS, type ComponentDefinition } from '@/lib/componentDefinitions';
import { useEditorStore } from '@/stores/editorStore';

export const ComponentsLibrary: React.FC = () => {
  const { addElement, activeArtboardId, document, activePageId, setActiveTool } = useEditorStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'navigation', label: 'Nav' },
    { id: 'controls', label: 'Controls' },
    { id: 'layout', label: 'Layout' },
    { id: 'content', label: 'Content' },
    { id: 'patterns', label: 'Patterns' },
  ];

  const filtered = COMPONENT_DEFINITIONS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddComponent = (comp: ComponentDefinition) => {
    const page = document?.pages.find((p) => p.id === activePageId) || document?.pages[0];
    const targetArtboard = page?.artboards.find((ab) => ab.id === activeArtboardId) || page?.artboards[0];
    if (!targetArtboard) return;

    // Calculate intelligent offset so multiple inserted elements don't stack on top of each other
    const existingCount = targetArtboard.elements.length;
    const offsetX = 40 + (existingCount % 5) * 20;
    const offsetY = 40 + (existingCount % 5) * 20;

    const el = comp.createElement(offsetX, offsetY);
    addElement(el, targetArtboard.id);
    setActiveTool('select');
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 text-xs select-none">
      {/* Search & Categories */}
      <div className="p-3 border-b border-gray-100 space-y-2.5 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reusable components..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full shrink-0 transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#7C3AED] text-white shadow-2xs font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Components */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No components match your search.
          </div>
        ) : (
          filtered.map((comp) => (
            <div
              key={comp.id}
              onClick={() => handleAddComponent(comp)}
              className="group relative p-2.5 rounded-xl border border-gray-200/80 bg-white hover:border-purple-400 hover:bg-purple-50/20 hover:shadow-2xs transition-all cursor-pointer"
              title={`Click to insert ${comp.name}`}
            >
              <div className="flex items-start gap-2.5">
                {/* Thumbnail SVG */}
                <div
                  className="w-14 h-10 rounded-lg bg-gray-50 border border-gray-200/60 flex items-center justify-center shrink-0 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: comp.thumbnailSvg }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-800 group-hover:text-purple-700 truncate">
                      {comp.name}
                    </h4>
                    <span className="p-0.5 rounded-md group-hover:bg-purple-100 transition-colors">
                      <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 shrink-0" />
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 leading-snug">
                    {comp.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComponentsLibrary;

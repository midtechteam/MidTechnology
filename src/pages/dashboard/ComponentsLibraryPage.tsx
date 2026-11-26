import React, { useState } from 'react';
import { Box, Search, Layers, Compass, FormInput, Grid, Image, ShieldCheck } from 'lucide-react';

export default function ComponentsLibraryPage() {
  const [search, setSearch] = useState('');

  const sections = [
    { name: 'Navigation', icon: Compass, count: 8, items: ['Top Navigation Bar', 'Bottom Navigation', 'Sidebar Rail', 'Breadcrumb Trail', 'Tabs Header', 'Pagination Bar'] },
    { name: 'Controls & Inputs', icon: FormInput, count: 9, items: ['Primary Button', 'Text Field Input', 'Search Bar with Shortcut', 'Dropdown Select', 'Switch Toggle', 'Checkbox', 'Radio Group'] },
    { name: 'Layout & Sections', icon: Grid, count: 12, items: ['Section Splitter', 'Responsive Frame', 'Container Grid (3-col)', 'Hero Header Section', 'Feature Split Section', 'Pricing Cards'] },
    { name: 'Content & Media', icon: Image, count: 10, items: ['Image Placeholder', 'Avatar Round', 'Media Video Box', 'Alert Callout', 'Badge Pill', 'Empty State Box', 'Data Table Mock'] },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reusable Component Library</h1>
        <p className="text-sm text-gray-500 mt-1">Design system elements and wireframe building blocks ready to place onto any canvas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div key={sec.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-scafbind-purple rounded-xl">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">{sec.name}</h3>
                </div>
                <span className="text-xs text-gray-400 font-medium">{sec.count} components</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {sec.items.map((item) => (
                  <div key={item} className="p-3 bg-gray-50 rounded-xl text-xs font-medium text-gray-700 border border-gray-100/80 hover:bg-purple-50/50 hover:border-purple-200 transition-colors cursor-pointer flex items-center justify-between">
                    <span>{item}</span>
                    <Box className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

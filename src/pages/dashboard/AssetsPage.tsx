import React from 'react';
import { UploadCloud, Image as ImageIcon, FileText, Trash2, ExternalLink } from 'lucide-react';

export default function AssetsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Assets</h1>
          <p className="text-sm text-gray-500 mt-1">Upload images, icons, and mock assets for your wireframes.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-scafbind-dark text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors">
          <UploadCloud className="w-4 h-4 text-purple-400" /> Upload Asset
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-scafbind-purple flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Drag and drop assets here</h3>
        <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, SVG up to 10MB each</p>
      </div>
    </div>
  );
}

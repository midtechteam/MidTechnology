import React from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export default function TrashPage() {
  const { restoreFromTrash } = useProjectStore();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
          <p className="text-sm text-gray-500 mt-1">Deleted projects are retained here for 30 days before permanent deletion.</p>
        </div>
      </div>

      <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Trash is empty</h3>
        <p className="text-xs text-gray-400 mt-1">Items moved to trash will appear here.</p>
      </div>
    </div>
  );
}

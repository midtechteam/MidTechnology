import React from 'react';
import { Share2, Globe, Lock } from 'lucide-react';

export default function SharedPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shared With You</h1>
        <p className="text-sm text-gray-500 mt-1">Wireframe projects shared by other teammates or external collaborators.</p>
      </div>

      <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-scafbind-purple flex items-center justify-center mx-auto mb-3">
          <Share2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">No shared projects yet</h3>
        <p className="text-xs text-gray-400 mt-1">When someone shares a project with your email, it will show up here.</p>
      </div>
    </div>
  );
}

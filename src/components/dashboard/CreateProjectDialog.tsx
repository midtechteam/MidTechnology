import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Monitor, Smartphone, Laptop, Tablet, LayoutDashboard, Plus, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { ARTBOARD_PRESETS } from '@/types';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  preset?: string;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onClose, preset }) => {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('website');
  const [customWidth, setCustomWidth] = useState(1280);
  const [customHeight, setCustomHeight] = useState(800);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preset) {
      if (['website', 'mobile', 'desktop', 'tablet', 'dashboard'].includes(preset)) {
        setCategory(preset);
      }
    }
  }, [preset]);

  if (!open) return null;

  const categories = [
    { id: 'website', label: 'Website', icon: Monitor, dims: '1440 × 900' },
    { id: 'mobile', label: 'Mobile App', icon: Smartphone, dims: '390 × 844' },
    { id: 'desktop', label: 'Desktop App', icon: Laptop, dims: '1366 × 768' },
    { id: 'tablet', label: 'Tablet', icon: Tablet, dims: '768 × 1024' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, dims: '1440 × 900' },
    { id: 'custom', label: 'Custom', icon: Plus, dims: 'User defined' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const newProject = await createProject(name.trim(), category as any);
      onClose();
      if (newProject && newProject.id) {
        navigate(`/editor/${newProject.id}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create New Wireframe</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a category and canvas preset to begin</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scafbind SaaS Platform"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:border-scafbind-purple focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this wireframe project..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:border-scafbind-purple focus:ring-2 focus:ring-purple-100 transition-all resize-none"
            />
          </div>

          {/* Category Presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Screen Category & Preset
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {categories.map((c) => {
                const Icon = c.icon;
                const selected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all",
                      selected
                        ? "border-scafbind-purple bg-scafbind-purple-light text-scafbind-purple shadow-xs"
                        : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                    )}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">{c.label}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{c.dims}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom dimensions if custom chosen */}
          {category === 'custom' && (
            <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-scafbind-dark hover:bg-black rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              {isSubmitting ? 'Creating...' : 'Create Wireframe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

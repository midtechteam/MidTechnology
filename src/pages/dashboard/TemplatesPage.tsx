import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Search, ArrowRight, Smartphone, Monitor, LayoutDashboard, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

const TEMPLATES = [
  {
    id: 'tpl-saas-landing',
    name: 'SaaS Landing Page',
    category: 'website',
    description: 'Hero, feature grid, pricing tier comparison, testimonials, and footer.',
    tag: 'Popular',
  },
  {
    id: 'tpl-mobile-ecommerce',
    name: 'E-Commerce Mobile Flow',
    category: 'mobile',
    description: 'Product listing, filter sheet, item detail, shopping bag, and checkout screen.',
    tag: 'Mobile',
  },
  {
    id: 'tpl-analytics-dashboard',
    name: 'Analytics Dashboard',
    category: 'dashboard',
    description: 'Header stats row, time series charts, data tables, and navigation rail.',
    tag: 'Dashboard',
  },
  {
    id: 'tpl-auth-flows',
    name: 'Auth & Onboarding Suite',
    category: 'website',
    description: 'Sign in, multi-step signup, forgot password, and email verification wireframes.',
    tag: 'Components',
  },
  {
    id: 'tpl-tablet-pos',
    name: 'Tablet POS Register',
    category: 'tablet',
    description: 'Catalog selector grid, order summary receipt panel, and numeric keypad.',
    tag: 'Tablet',
  },
  {
    id: 'tpl-admin-crm',
    name: 'CRM Workspace & Pipeline',
    category: 'dashboard',
    description: 'Kanban deal stages, lead cards, activity sidebar, and quick actions.',
    tag: 'Productivity',
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = TEMPLATES.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    const proj = await createProject(`${template.name} Copy`, template.category as any);
    if (proj?.id) {
      navigate(`/editor/${proj.id}`);
    }
  };

  return (
    <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wireframe Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Jump-start your design with curated production-ready wireframe layouts.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-scafbind-purple"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-lg hover:border-purple-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-scafbind-purple bg-scafbind-purple-light px-2.5 py-1 rounded-full">
                  {tpl.tag}
                </span>
                <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                  {tpl.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-scafbind-purple transition-colors">
                {tpl.name}
              </h3>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">Multi-artboard wireframe</span>
              <button
                onClick={() => handleUseTemplate(tpl)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-scafbind-dark hover:bg-black px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Use Template <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import {
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Copy,
} from 'lucide-react';

export const EditorBottomBar: React.FC = () => {
  const {
    document,
    activePageId,
    setActivePage,
    addPage,
    deletePage,
    duplicatePage,
    renamePage,
  } = useEditorStore();

  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageNameInput, setPageNameInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pages = document?.pages || [];
  const currentIndex = pages.findIndex((p) => p.id === activePageId);
  const activePage = pages[currentIndex] || pages[0];
  const pageNum = currentIndex >= 0 ? currentIndex + 1 : 1;
  const totalPages = pages.length || 1;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPageDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const handlePrevPage = () => {
    if (currentIndex > 0) {
      setActivePage(pages[currentIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentIndex < pages.length - 1) {
      setActivePage(pages[currentIndex + 1].id);
    }
  };

  const isAddingRef = useRef(false);

  const handleAddPage = () => {
    // Prevent duplicate screen creation from rapid single/double clicks
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setTimeout(() => {
      isAddingRef.current = false;
    }, 400);

    const name = `Page ${pages.length + 1}`;
    addPage(name);
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingPageId(id);
    setPageNameInput(name);
  };

  const handleCommitRename = (id: string) => {
    if (pageNameInput.trim()) {
      renamePage(id, pageNameInput.trim());
    }
    setEditingPageId(null);
  };

  return (
    <footer className="h-10 px-4 bg-white border-t border-gray-200/90 flex items-center justify-between shrink-0 select-none z-30 shadow-2xs">
      {/* LEFT: Page selector dropdown & Add Page matching Reference Image */}
      <div className="flex items-center gap-1.5" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setPageDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors cursor-pointer"
            title="Switch Page"
          >
            <span>{activePage?.name || 'Page 1'}</span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {/* Page Dropdown Menu */}
          {pageDropdownOpen && (
            <div className="absolute left-0 bottom-full mb-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[200px] animate-fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                <span>Pages ({totalPages})</span>
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActivePage(p.id);
                      setPageDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer group ${
                      p.id === activePageId
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {editingPageId === p.id ? (
                      <input
                        type="text"
                        value={pageNameInput}
                        onChange={(e) => setPageNameInput(e.target.value)}
                        onBlur={() => handleCommitRename(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitRename(p.id);
                          if (e.key === 'Escape') setEditingPageId(null);
                        }}
                        autoFocus
                        className="bg-white border border-purple-400 rounded px-1 text-xs outline-none w-28"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="truncate flex-1"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(p.id, p.name);
                        }}
                      >
                        {p.name}
                      </span>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicatePage(p.id);
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-700"
                        title="Duplicate page"
                      >
                        <Copy size={11} />
                      </button>
                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(p.id);
                          }}
                          className="p-0.5 text-gray-400 hover:text-red-600"
                          title="Delete page"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Page Button */}
        <button
          onClick={handleAddPage}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Add new page"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* RIGHT: Previous and Next Page Navigation `<  1/1  >` matching Reference Image */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevPage}
          disabled={currentIndex <= 0}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>

        <span className="text-xs font-semibold text-gray-700 font-mono px-2 py-0.5">
          {pageNum}/{totalPages}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentIndex >= pages.length - 1}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </footer>
  );
};

export default EditorBottomBar;

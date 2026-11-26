import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  LayoutDashboard,
} from "lucide-react";
import { formatTimestamp, cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/projectStore";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    thumbnail?: string | null;
    updatedAt: string;
    createdAt?: string;
    pageCount?: number;
  };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { deleteProject, duplicateProject, renameProject } = useProjectStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "mobile":
        return <Smartphone className="w-3.5 h-3.5 text-purple-600" />;
      case "desktop":
        return <Laptop className="w-3.5 h-3.5 text-blue-600" />;
      case "tablet":
        return <Tablet className="w-3.5 h-3.5 text-indigo-600" />;
      case "dashboard":
        return <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-violet-600" />;
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameVal.trim() && renameVal !== project.name) {
      renameProject(project.id, renameVal.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      onClick={() => navigate(`/editor/${project.id}`)}
      className="group relative flex flex-col bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-violet-300 transition-all duration-200 cursor-pointer"
    >
      {/* ── Thumbnail Wireframe Preview ─────────────────────────────── */}
      <div className="relative w-full aspect-[16/10] bg-gray-50/80 border-b border-gray-100 overflow-hidden flex items-center justify-center p-3 select-none">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          /* Realistic Wireframe SVG preview matching Scafbind visual reference */
          <div className="w-full h-full bg-white rounded-xl border border-gray-200/70 p-2.5 shadow-2xs flex flex-col gap-1.5 transition-transform group-hover:scale-[1.02] duration-200">
            {/* Header bar mock */}
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
              <div className="w-10 h-2 rounded bg-violet-200" />
              <div className="flex gap-1">
                <div className="w-5 h-1.5 rounded bg-gray-200" />
                <div className="w-5 h-1.5 rounded bg-gray-200" />
              </div>
            </div>
            {/* Hero mock */}
            <div className="flex gap-2 h-10">
              <div className="flex-1 flex flex-col justify-center gap-1">
                <div className="w-14 h-2 bg-gray-800 rounded" />
                <div className="w-20 h-1.5 bg-gray-300 rounded" />
                <div className="w-8 h-2 bg-violet-600 rounded mt-0.5" />
              </div>
              <div className="w-12 h-full bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-violet-200/60" />
              </div>
            </div>
            {/* Cards mock */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <div className="h-5 rounded bg-gray-100 border border-gray-200/60" />
              <div className="h-5 rounded bg-gray-100 border border-gray-200/60" />
              <div className="h-5 rounded bg-gray-100 border border-gray-200/60" />
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700 flex items-center gap-1 border border-gray-200/70 shadow-2xs">
          {getCategoryIcon(project.category)}
          <span className="capitalize">{project.category || "Website"}</span>
        </div>
      </div>

      {/* ── Card Footer / Info Bar ──────────────────────────────────── */}
      <div className="p-3.5 flex items-center justify-between gap-2 bg-white">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <form onSubmit={handleRename} onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={handleRename}
                className="w-full text-sm font-semibold text-gray-900 px-1 py-0.5 border border-violet-400 rounded-lg focus:outline-hidden"
              />
            </form>
          ) : (
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-violet-700 transition-colors">
              {project.name}
            </h3>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            Edited {formatTimestamp(project.updatedAt)}
          </p>
        </div>

        {/* 3-dots Menu Button */}
        <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="More actions"
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-xl shadow-xl border border-gray-200/90 py-1.5 z-40 animate-fade-in text-xs font-medium">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/editor/${project.id}`);
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> Open
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsRenaming(true);
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Rename
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  duplicateProject(project.id);
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  deleteProject(project.id);
                }}
                className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

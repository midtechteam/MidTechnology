import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Play,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  LayoutDashboard,
  FileText,
  Square,
  Pencil,
  Share2,
  Download,
  ArrowRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const CREATE_NEW_OPTIONS = [
  { id: "website", title: "Website", subtitle: "Wireframe", icon: Monitor },
  { id: "mobile", title: "Mobile App", subtitle: "Wireframe", icon: Smartphone },
  { id: "desktop", title: "Desktop App", subtitle: "Wireframe", icon: Laptop },
  { id: "tablet", title: "Tablet", subtitle: "Wireframe", icon: Tablet },
  { id: "dashboard", title: "Dashboard", subtitle: "Wireframe", icon: LayoutDashboard },
  { id: "template", title: "From Template", subtitle: "Browse", icon: FileText },
  { id: "blank", title: "Blank Canvas", subtitle: "Empty", icon: Square },
];

const ACTIVITY = [
  { id: 1, type: "edit", text: "You edited", project: "Landing Page v2", time: "2 min ago" },
  { id: 2, type: "share", text: "You shared", project: "Mobile App Flow", time: "1 hour ago" },
  { id: 3, type: "download", text: "Exported", project: "Dashboard UI", time: "3 hours ago" },
  { id: 4, type: "edit", text: "You edited", project: "Component Library", time: "Yesterday" },
  { id: 5, type: "share", text: "Team accessed", project: "Brand Guidelines", time: "2 days ago" },
];

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const { projects, recentProjects } = useProjectStore();
  const navigate = useNavigate();

  const [selectedPreset, setSelectedPreset] = useState("website");
  const [createOpen, setCreateOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<string | undefined>(undefined);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    document.title = "Home — Scafbind";
  }, []);

  const firstName =
    profile?.name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const recent = recentProjects?.() ?? projects?.slice(0, 6) ?? [];

  function handleCreateNew(id: string) {
    setSelectedPreset(id);
    if (id === "template") {
      navigate("/dashboard/templates");
      return;
    }
    setCreatePreset(id === "blank" ? undefined : id);
    setCreateOpen(true);
  }

  return (
    <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 lg:space-y-10">
      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-100/90 bg-gradient-to-br from-violet-50/70 via-white to-purple-50/30 p-6 sm:p-8 md:p-10 shadow-xs">
        {/* Subtle decorative purple glow background */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-violet-200/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Hero Content */}
          <div className="flex-1 max-w-xl">
            <p className="text-xs sm:text-sm font-semibold text-violet-600 mb-2.5 flex items-center gap-1.5">
              <span>{getGreeting()}, {firstName}</span>
              <span className="inline-block animate-pulse">👋</span>
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 tracking-tight leading-[1.18] mb-3 sm:mb-4">
              Design wireframes,{" "}
              <br className="hidden sm:inline" />
              layouts and{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                more.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-lg">
              Plan, design and export your ideas — from wireframes to code.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setCreatePreset(undefined);
                  setCreateOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>Create Wireframe</span>
              </button>
              <button
                onClick={() => setVideoOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
              >
                <Play size={14} className="text-violet-600 fill-violet-600/20" />
                <span>Watch how it works</span>
              </button>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="relative shrink-0 w-full lg:w-[380px] h-[210px] sm:h-[230px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-100/90 via-purple-50/70 to-violet-200/60 opacity-80 shadow-inner" />
            <svg
              className="relative z-10 drop-shadow-xl max-w-full h-auto"
              width="300"
              height="180"
              viewBox="0 0 300 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Browser chrome */}
              <rect x="10" y="10" width="280" height="160" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
              <rect x="10" y="10" width="280" height="28" rx="12" fill="#F9FAFB" />
              <rect x="10" y="30" width="280" height="8" fill="#F9FAFB" />
              <circle cx="28" cy="24" r="5" fill="#FCA5A5" />
              <circle cx="43" cy="24" r="5" fill="#FCD34D" />
              <circle cx="58" cy="24" r="5" fill="#86EFAC" />
              {/* URL bar */}
              <rect x="75" y="17" width="150" height="14" rx="4" fill="#E5E7EB" />
              {/* Content wireframe elements */}
              <rect x="24" y="52" width="80" height="40" rx="6" fill="#EDE9FE" />
              <rect x="116" y="52" width="160" height="10" rx="3" fill="#E5E7EB" />
              <rect x="116" y="68" width="120" height="8" rx="3" fill="#E5E7EB" />
              <rect x="116" y="82" width="80" height="8" rx="3" fill="#DDD6FE" />
              <rect x="24" y="104" width="252" height="8" rx="3" fill="#E5E7EB" />
              <rect x="24" y="118" width="200" height="8" rx="3" fill="#E5E7EB" />
              <rect x="24" y="132" width="140" height="8" rx="3" fill="#E5E7EB" />
              <rect x="24" y="150" width="60" height="16" rx="6" fill="#7C3AED" />
              <rect x="92" y="150" width="60" height="16" rx="6" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── 2. Create New Section (Responsive Grid of Tiles) ───────── */}
      <section className="space-y-3.5">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Create new</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
          {CREATE_NEW_OPTIONS.map(({ id, title, subtitle, icon: Icon }) => {
            const isSelected = selectedPreset === id;
            return (
              <button
                key={id}
                onClick={() => handleCreateNew(id)}
                className={cn(
                  "group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer h-full min-h-[108px]",
                  isSelected
                    ? "border-violet-300 bg-violet-50/80 text-violet-950 shadow-2xs ring-1 ring-violet-400/30"
                    : "border-gray-200/90 bg-white text-gray-800 hover:border-violet-200 hover:bg-violet-50/20 hover:shadow-2xs"
                )}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-violet-600 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-600 group-hover:bg-violet-100 group-hover:text-violet-700"
                    )}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <div>
                  <p
                    className={cn(
                      "text-xs sm:text-sm font-semibold leading-tight line-clamp-1",
                      isSelected ? "text-violet-950 font-bold" : "text-gray-900 group-hover:text-violet-900"
                    )}
                  >
                    {title}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] mt-0.5 leading-tight",
                      isSelected ? "text-violet-600" : "text-gray-400"
                    )}
                  >
                    {subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Bottom Two-Column: Recent Projects & Recent Activity ─── */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Recent Projects */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Recent Projects</h2>
            <button
              onClick={() => navigate("/dashboard/projects")}
              className="text-xs sm:text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-3xl p-10 text-center bg-white">
              <p className="text-gray-400 text-sm mb-3">No projects yet.</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="text-sm text-violet-600 font-semibold hover:underline cursor-pointer"
              >
                + Create your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {recent.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <aside className="w-full xl:w-80 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Recent activity</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs divide-y divide-gray-100 overflow-hidden">
            {ACTIVITY.map(({ id, type, text, project, time }) => {
              const iconMap: Record<string, { Icon: any; color: string; bg: string }> = {
                edit: { Icon: Pencil, color: "text-violet-600", bg: "bg-violet-50" },
                share: { Icon: Share2, color: "text-blue-600", bg: "bg-blue-50" },
                download: { Icon: Download, color: "text-emerald-600", bg: "bg-emerald-50" },
              };
              const { Icon, color, bg } = iconMap[type] ?? iconMap.edit;
              return (
                <div key={id} className="flex items-start gap-3 p-3.5 hover:bg-gray-50/50 transition-colors">
                  <span className={cn("mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs", bg)}>
                    <Icon size={13} className={color} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 leading-snug">
                      {text}{" "}
                      <span className="font-semibold text-gray-900">{project}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ── Dialogs & Modals ────────────────────────────────────────── */}
      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        preset={createPreset}
      />

      {/* Video Modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Watch how it works</h3>
              <button
                onClick={() => setVideoOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="aspect-video bg-gray-950 flex items-center justify-center">
              <div className="text-center text-gray-400 space-y-2">
                <div className="w-16 h-16 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/30">
                  <Play size={28} className="translate-x-0.5 fill-violet-400/40" />
                </div>
                <p className="text-sm font-medium text-gray-300">Quick product tour video</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Learn how to quickly assemble wireframes, prototype flows, and export code.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

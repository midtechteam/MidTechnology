import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Layout,
  Plus,
  ChevronLeft,
  ChevronRight,
  Crown,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

interface RailItem {
  label: string;
  icon: LucideIcon;
  to: string;
  exact?: boolean;
}

const RAIL_NAV_ITEMS: RailItem[] = [
  { label: "Home", icon: Home, to: "/dashboard", exact: true },
  { label: "Projects", icon: FolderOpen, to: "/dashboard/projects", exact: false },
  { label: "Templates", icon: Layout, to: "/dashboard/templates", exact: false },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, openModal } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col h-full select-none justify-between bg-white">
      {/* ── Top Navigation Area ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 py-3 px-2 space-y-1.5 overflow-y-auto">
        {/* Navigation items: Home, Projects, Templates */}
        <nav className="space-y-1">
          {RAIL_NAV_ITEMS.map(({ label, icon: Icon, to, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);

            return (
              <div key={to} className="relative group flex justify-center">
                <NavLink
                  to={to}
                  end={exact}
                  className={cn(
                    "flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer",
                    sidebarCollapsed
                      ? "h-10 w-10 justify-center px-0"
                      : "w-full px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-violet-50 text-violet-700 font-semibold shadow-2xs ring-1 ring-violet-200/50"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  )}
                  aria-label={label}
                >
                  <Icon
                    size={19}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-violet-600" : "text-gray-400 group-hover:text-gray-700"
                    )}
                  />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </NavLink>

                {/* Floating Tooltip when Rail is Collapsed */}
                {sidebarCollapsed && (
                  <div
                    role="tooltip"
                    className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="my-2 border-t border-gray-100 mx-1" />

        {/* Create Wireframe (+) Action Button */}
        <div className="relative group flex justify-center">
          <button
            onClick={() => openModal("create-project")}
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer font-semibold",
              sidebarCollapsed
                ? "h-10 w-10 justify-center p-0"
                : "w-full px-3 py-2 text-sm justify-start"
            )}
            title={sidebarCollapsed ? "Create Wireframe" : undefined}
            aria-label="Create Wireframe"
          >
            <Plus size={18} className="shrink-0 stroke-[2.5]" />
            {!sidebarCollapsed && <span className="truncate">Create Wireframe</span>}
          </button>

          {/* Floating Tooltip when Collapsed */}
          {sidebarCollapsed && (
            <div
              role="tooltip"
              className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              Create Wireframe
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Section: Upgrade & Collapse ───────────────────────── */}
      <div className="shrink-0 pb-2 pt-1 border-t border-gray-100 bg-white">
        {/* Upgrade to Pro Action */}
        {!sidebarCollapsed ? (
          <div className="p-2.5">
            <button
              onClick={() => navigate("/dashboard/pricing")}
              className="w-full rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-3.5 text-left text-white hover:from-violet-700 hover:to-indigo-800 transition-all duration-200 group shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1 rounded-lg bg-white/10 backdrop-blur-xs">
                  <Crown size={15} className="text-yellow-300" />
                </span>
                <ArrowRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="font-semibold text-xs leading-tight">Upgrade to Pro</p>
              <p className="text-[11px] text-purple-200/90 mt-0.5">Unlock advanced export</p>
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-2 relative group">
            <button
              onClick={() => navigate("/dashboard/pricing")}
              className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-2xs cursor-pointer"
              title="Upgrade to Pro"
              aria-label="Upgrade to Pro"
            >
              <Crown size={16} className="text-yellow-300" />
            </button>
            <div
              role="tooltip"
              className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              Upgrade to Pro
            </div>
          </div>
        )}

        {/* Expand / Collapse Rail Toggle */}
        <div className="px-2 pt-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "flex items-center gap-2 w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 rounded-xl transition-colors cursor-pointer",
              sidebarCollapsed ? "justify-center" : "px-3"
            )}
            title={sidebarCollapsed ? "Expand navigation rail" : "Collapse navigation rail"}
            aria-label={sidebarCollapsed ? "Expand navigation rail" : "Collapse navigation rail"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span>Collapse Rail</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

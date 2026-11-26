import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Layout,
  ChevronDown,
  Search,
  X,
  Bell,
  HelpCircle,
  LogOut,
  Settings,
  User,
  Check,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";

const WORKSPACES = ["Personal", "Team Alpha", "Client Work"];

const TOP_NAV_ITEMS = [
  { label: "Home", to: "/dashboard", icon: Home, exact: true },
  { label: "Projects", to: "/dashboard/projects", icon: FolderOpen, exact: false },
  { label: "Templates", to: "/dashboard/templates", icon: Layout, exact: false },
];

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const { workspace, setWorkspace } = useUIStore();
  const { projects, setSearch } = useProjectStore();

  const [wsOpen, setWsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hasNotif, setHasNotif] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const wsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns & search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setWsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K to toggle search, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
          return next;
        });
      } else if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearch("");
    searchInputRef.current?.focus();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearch(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate("/dashboard/projects");
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const displayName = profile?.name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const currentWorkspace = workspace ?? "Personal";

  // Filter matching projects for quick command search
  const matchingProjects = searchQuery.trim()
    ? (projects || []).filter((p: any) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  return (
    <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
      {/* ── Left Section: Scafbind Logo Asset (Moderately larger, no duplicate text) ── */}
      <div className="flex items-center shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500/50 select-none py-0.5"
          title="Scafbind Home"
        >
          <img
            src="/scafbind-logo.png"
            alt="Scafbind"
            className="h-9 sm:h-9.5 w-auto max-h-10 object-contain shrink-0 transition-transform hover:opacity-95"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.indexOf("favicon.svg") === -1) {
                target.src = "/favicon.svg";
              }
            }}
          />
        </Link>
      </div>

      {/* ── Center Section: Horizontal Navigation & Workspace Selector ─ */}
      <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 justify-center">
        {/* Navigation Items: Home, Projects, Templates */}
        <nav className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-xl border border-gray-200/50 shadow-2xs">
          {TOP_NAV_ITEMS.map(({ label, to, icon: Icon, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-white text-violet-700 font-semibold shadow-2xs ring-1 ring-black/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-violet-600" : "text-gray-500"
                  )}
                />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-gray-200 mx-0.5" />

        {/* Minimal Workspace Selector */}
        <div className="relative shrink-0" ref={wsRef}>
          <button
            onClick={() => setWsOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-gray-200/90 bg-white hover:bg-gray-50/90 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-800 shadow-2xs transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-violet-500/20"
            title="Switch workspace"
            aria-expanded={wsOpen}
          >
            <Building2 size={14} className="text-violet-600" />
            <span className="max-w-[100px] truncate">{currentWorkspace}</span>
            <ChevronDown
              size={13}
              className={cn("text-gray-400 transition-transform duration-200", wsOpen && "rotate-180")}
            />
          </button>

          {wsOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-48 rounded-xl border border-gray-200/90 bg-white shadow-xl py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Workspaces
              </div>
              {WORKSPACES.map((ws) => (
                <button
                  key={ws}
                  onClick={() => {
                    setWorkspace(ws);
                    setWsOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left cursor-pointer"
                >
                  <span className="font-medium">{ws}</span>
                  {ws === currentWorkspace && <Check size={14} className="text-violet-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Section: Search, Notifications, Help, User Profile ─── */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Workspace selector on smaller screens where center is hidden */}
        <div className="relative md:hidden shrink-0" ref={wsRef}>
          <button
            onClick={() => setWsOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200/90 bg-white hover:bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-800 shadow-2xs cursor-pointer"
            title="Switch workspace"
          >
            <Building2 size={13} className="text-violet-600" />
            <span className="max-w-[70px] truncate">{currentWorkspace}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>
          {wsOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-gray-200/90 bg-white shadow-xl py-1.5 z-50 animate-fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Workspaces
              </div>
              {WORKSPACES.map((ws) => (
                <button
                  key={ws}
                  onClick={() => {
                    setWorkspace(ws);
                    setWsOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left"
                >
                  <span className="font-medium">{ws}</span>
                  {ws === currentWorkspace && <Check size={14} className="text-violet-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Icon-Only by Default Search Interaction ────────────────── */}
        <div className="relative" ref={searchContainerRef}>
          {/* Default: Modern Search Icon Only */}
          <button
            onClick={handleOpenSearch}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Search projects (⌘K)"
            aria-label="Search"
            aria-expanded={isSearchOpen}
          >
            <Search size={18} />
          </button>

          {/* Expanded Search Input Popover (hangs below top bar without breaking/overlapping layout) */}
          {isSearchOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-200/90 shadow-2xl p-2 animate-fade-in">
              <div className="relative flex items-center w-full">
                <Search
                  size={16}
                  className="absolute left-3 text-violet-600 pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search projects, templates..."
                  className="w-full bg-gray-50/90 border border-violet-200 rounded-xl pl-9 pr-14 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium transition-all shadow-2xs"
                  aria-label="Search input"
                  autoFocus
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer"
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <button
                    onClick={handleCloseSearch}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Close (Esc)"
                    aria-label="Close search"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Quick Results Flyout */}
              {searchQuery.trim().length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 max-h-60 overflow-y-auto">
                  {matchingProjects.length > 0 ? (
                    <>
                      <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Projects ({matchingProjects.length})
                      </div>
                      {matchingProjects.slice(0, 5).map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigate(`/editor/${p.id}`);
                          }}
                          className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left cursor-pointer"
                        >
                          <span className="font-medium truncate">{p.name}</span>
                          <span className="text-xs text-gray-400 shrink-0 ml-2 capitalize">
                            {p.category || "Wireframe"}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1 px-2.5">
                        <button
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigate("/dashboard/projects");
                          }}
                          className="text-xs text-violet-600 hover:text-violet-700 font-semibold py-1 block w-full text-left cursor-pointer"
                        >
                          View all in Projects →
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-gray-400">
                      No matching projects found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => setHasNotif(false)}
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {hasNotif && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white" />
          )}
        </button>

        {/* Help */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setHelpOpen((v) => !v)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Help & Resources"
            aria-label="Help"
            aria-expanded={helpOpen}
          >
            <HelpCircle size={18} />
          </button>
          {helpOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-gray-200/90 bg-white shadow-xl py-2 z-50 animate-fade-in text-xs">
              <div className="px-3 py-1 font-bold text-gray-900 border-b border-gray-100 pb-1.5 mb-1">
                Help & Support
              </div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="block px-3 py-1.5 text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                Documentation & Guides
              </a>
              <button
                onClick={() => {
                  setHelpOpen(false);
                  navigate("/dashboard/templates");
                }}
                className="block w-full text-left px-3 py-1.5 text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors cursor-pointer"
              >
                Explore Template Library
              </button>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-3 py-1 text-[11px] text-gray-400">
                Shortcuts: <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">⌘K</kbd> to search
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative ml-0.5" ref={userRef}>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1 sm:px-2 sm:py-1 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="User menu"
            aria-expanded={userOpen}
          >
            <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 ring-2 ring-violet-100 shadow-2xs">
              {avatarInitial}
            </span>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[110px] truncate">
              {displayName}
            </span>
            <ChevronDown
              size={13}
              className={cn("hidden sm:block text-gray-400 transition-transform duration-200", userOpen && "rotate-180")}
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-gray-200/90 bg-white shadow-xl py-1.5 z-50 animate-fade-in">
              <div className="px-3.5 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email ?? ""}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/dashboard/profile");
                    setUserOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left cursor-pointer"
                >
                  <User size={15} className="text-gray-400" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard/settings");
                    setUserOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left cursor-pointer"
                >
                  <Settings size={15} className="text-gray-400" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  signOut?.();
                  setUserOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut size={15} className="text-red-500" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

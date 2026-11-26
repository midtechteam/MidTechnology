import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const NO_SIDEBAR_ROUTES = ["/dashboard", "/dashboard/projects", "/dashboard/templates"];

export default function DashboardLayout() {
  const location = useLocation();
  const isNoSidebarPage = NO_SIDEBAR_ROUTES.some(
    (route) => location.pathname === route || location.pathname === `${route}/`
  );

  const { mobileDrawerOpen, sidebarCollapsed, setMobileDrawer, activeModal, closeModal } = useUIStore();
  const sidebarOpen = mobileDrawerOpen;
  const setSidebarOpen = setMobileDrawer;

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50/60 text-gray-900">
      {/* Top navigation bar spanning across the top */}
      <header className="sticky top-0 z-30 h-14 flex items-center bg-white border-b border-gray-200/80 px-4 sm:px-6 shadow-2xs shrink-0">
        {/* Mobile menu toggle (hamburger) — only shown when sidebar exists on pages other than Home, Projects, Templates */}
        {!isNoSidebarPage && (
          <button
            className="mr-3 p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 md:hidden transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation rail"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Top bar with Logo, Horizontal Navigation, Workspace selector, Command Palette Search, and User profile */}
        <TopBar />
      </header>

      {/* Main layout below top bar: Icon rail (shown only on components, assets, team, shared, trash) + Content */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Mobile overlay for pages with sidebar */}
        {!isNoSidebarPage && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-2xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Vertical Icon Rail — completely omitted on Home, Projects, and Templates */}
        {!isNoSidebarPage && (
          <aside
            className={cn(
              "z-40 md:z-20 flex flex-col bg-white border-r border-gray-200/80 transition-all duration-300 ease-in-out shadow-xs shrink-0 h-full",
              // Mobile: fixed drawer below header
              "fixed inset-y-14 left-0 md:static md:inset-auto",
              sidebarCollapsed ? "w-16" : "w-56",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <Sidebar />
          </aside>
        )}

        {/* Scrollable page content: natural full viewport width without sidebar */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Wireframe Creation Dialog triggered globally */}
      <CreateProjectDialog
        open={activeModal === "create-project"}
        onClose={closeModal}
      />
    </div>
  );
}

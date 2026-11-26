import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import DashboardLayout from "@/layouts/DashboardLayout";

// Mock stores
vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    user: { id: "test-user", email: "alex@scafbind.io", user_metadata: { name: "Alex Morgan" } },
    profile: { name: "Alex Morgan" },
    loading: false,
    initialized: true,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/stores/uiStore", () => {
  let sidebarCollapsed = false;
  let workspace = "Personal";
  let activeModal: string | null = null;
  return {
    useUIStore: () => ({
      sidebarCollapsed,
      workspace,
      activeModal,
      setSidebarCollapsed: vi.fn((val) => { sidebarCollapsed = val; }),
      setWorkspace: vi.fn((ws) => { workspace = ws; }),
      openModal: vi.fn((m) => { activeModal = m; }),
      closeModal: vi.fn(() => { activeModal = null; }),
    }),
  };
});

vi.mock("@/stores/projectStore", () => ({
  useProjectStore: () => ({
    projects: [
      {
        id: "proj-1",
        name: "E-Commerce App Wireframe",
        category: "mobile",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "proj-2",
        name: "Analytics SaaS Dashboard",
        category: "dashboard",
        updatedAt: new Date().toISOString(),
      },
    ],
    recentProjects: () => [
      {
        id: "proj-1",
        name: "E-Commerce App Wireframe",
        category: "mobile",
        updatedAt: new Date().toISOString(),
      },
    ],
    setSearch: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
    duplicateProject: vi.fn(),
    renameProject: vi.fn(),
  }),
}));

describe("Modern Home Page & Navigation Redesign", () => {
  it("TopBar renders Scafbind logo asset at far left with proper attributes and no duplicate text", () => {
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    );

    const logo = screen.getByAltText("Scafbind");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/scafbind-logo.png");
    // Verify duplicate text brand span is removed
    const brandTexts = screen.queryAllByText("Scafbind");
    expect(brandTexts.length).toBe(0);
  });

  it("TopBar renders horizontal navigation items (Home, Projects, Templates) and workspace selector", () => {
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getAllByText("Personal").length).toBeGreaterThanOrEqual(1);
  });

  it("TopBar search starts icon-only by default and expands upon click", () => {
    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    );

    // Search button should be icon-only with accessible label "Search"
    const searchTrigger = screen.getByLabelText("Search");
    expect(searchTrigger).toBeInTheDocument();

    // Click search trigger
    fireEvent.click(searchTrigger);

    // Search input should now be open and focused
    const input = screen.getByLabelText("Search input");
    expect(input).toBeInTheDocument();

    // Type query
    fireEvent.change(input, { target: { value: "E-Commerce" } });
    expect(input).toHaveValue("E-Commerce");

    // Close button works
    const closeBtn = screen.getByLabelText("Close search");
    fireEvent.click(closeBtn);
    expect(screen.queryByLabelText("Search input")).toBeNull();
  });

  it("Sidebar icon rail only contains Home, Projects, Templates, and Create Wireframe (+)", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Visible items
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
    expect(screen.getByLabelText("Projects")).toBeInTheDocument();
    expect(screen.getByLabelText("Templates")).toBeInTheDocument();
    expect(screen.getByLabelText("Create Wireframe")).toBeInTheDocument();

    // Removed entries from sidebar navigation
    expect(screen.queryByLabelText("Components")).toBeNull();
    expect(screen.queryByLabelText("Assets")).toBeNull();
    expect(screen.queryByLabelText("Team")).toBeNull();
    expect(screen.queryByLabelText("Shared")).toBeNull();
    expect(screen.queryByLabelText("Trash")).toBeNull();
  });

  it("DashboardPage renders hero, creation grid, recent projects, and recent activity", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Hero section
    expect(screen.getByText(/Design wireframes,/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan, design and export your ideas/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Wireframe/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Watch how it works/i })).toBeInTheDocument();

    // Create New Grid
    expect(screen.getByText("Create new")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
    expect(screen.getByText("Desktop App")).toBeInTheDocument();
    expect(screen.getByText("Tablet")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("From Template")).toBeInTheDocument();
    expect(screen.getByText("Blank Canvas")).toBeInTheDocument();

    // Recent Projects
    expect(screen.getByText("Recent Projects")).toBeInTheDocument();
    expect(screen.getByText("View all")).toBeInTheDocument();

    // Recent Activity
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getByText("Landing Page v2")).toBeInTheDocument();
  });

  it("DashboardLayout completely omits the sidebar on Home, Projects, and Templates pages", () => {
    // 1. Home page
    const { container: homeContainer } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardLayout />
      </MemoryRouter>
    );
    expect(homeContainer.querySelector("aside")).toBeNull();

    // 2. Projects page
    const { container: projContainer } = render(
      <MemoryRouter initialEntries={["/dashboard/projects"]}>
        <DashboardLayout />
      </MemoryRouter>
    );
    expect(projContainer.querySelector("aside")).toBeNull();

    // 3. Templates page
    const { container: tmplContainer } = render(
      <MemoryRouter initialEntries={["/dashboard/templates"]}>
        <DashboardLayout />
      </MemoryRouter>
    );
    expect(tmplContainer.querySelector("aside")).toBeNull();
  });

  it("DashboardLayout preserves the sidebar on other pages (/dashboard/components)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard/components"]}>
        <DashboardLayout />
      </MemoryRouter>
    );

    // Sidebar aside container should exist on other pages
    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
  });
});

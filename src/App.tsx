import React, { Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/Toaster";
import { useAuthStore } from "@/stores/authStore";
import LoadingScreen from "@/components/ui/LoadingScreen";

// Lazy-loaded page components
const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = React.lazy(() => import("@/pages/auth/SignupPage"));
const ResetPasswordPage = React.lazy(() => import("@/pages/auth/ResetPasswordPage"));
const DashboardLayout = React.lazy(() => import("@/layouts/DashboardLayout"));
const DashboardPage = React.lazy(() => import("@/pages/dashboard/DashboardPage"));
const ProjectsPage = React.lazy(() => import("@/pages/dashboard/ProjectsPage"));
const TemplatesPage = React.lazy(() => import("@/pages/dashboard/TemplatesPage"));
const ComponentsLibraryPage = React.lazy(() => import("@/pages/dashboard/ComponentsLibraryPage"));
const AssetsPage = React.lazy(() => import("@/pages/dashboard/AssetsPage"));
const TeamPage = React.lazy(() => import("@/pages/dashboard/TeamPage"));
const SharedPage = React.lazy(() => import("@/pages/dashboard/SharedPage"));
const TrashPage = React.lazy(() => import("@/pages/dashboard/TrashPage"));
const EditorPage = React.lazy(() => import("@/pages/editor/EditorPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));

// ProtectedRoute: Redirects to /auth/login if the user is not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

// RootRedirect: Redirects to /dashboard or /auth/login based on auth state
function RootRedirect() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return <LoadingScreen />;
  }

  return <Navigate to={user ? "/dashboard" : "/auth/login"} replace />;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth routes (public) */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/reset" element={<ResetPasswordPage />} />

          {/* Dashboard routes (protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="components" element={<ComponentsLibraryPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="shared" element={<SharedPage />} />
            <Route path="trash" element={<TrashPage />} />
          </Route>

          {/* Editor route (protected, full screen, no dashboard layout) */}
          <Route
            path="/editor/:projectId"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <Toaster />
    </>
  );
}

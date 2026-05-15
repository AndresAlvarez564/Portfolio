import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { App as AntApp } from "antd";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROUTES } from "./constants";

// Public pages
import HomePage from "./pages/public/HomePage";
import ProjectsPage from "./pages/public/ProjectsPage";
import ProjectDetailPage from "./pages/public/ProjectDetailPage";
import AboutPage from "./pages/public/AboutPage";
import NotFoundPage from "./pages/public/NotFoundPage";

// Admin pages
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProfileSettingsPage from "./pages/admin/ProfileSettingsPage";
import ProjectsListPage from "./pages/admin/ProjectsListPage";
import ProjectFormPage from "./pages/admin/ProjectFormPage";

const App = () => {
  return (
    <AntApp>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
          <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />

          {/* Admin routes — protected */}
          <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_LOGIN} replace />} />
          <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_SETTINGS}
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_PROJECTS}
            element={
              <ProtectedRoute>
                <ProjectsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.ADMIN_PROJECTS}/create`}
            element={
              <ProtectedRoute>
                <ProjectFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.ADMIN_PROJECTS}/:id/edit`}
            element={
              <ProtectedRoute>
                <ProjectFormPage />
              </ProtectedRoute>
            }
          />

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AntApp>
  );
};

export default App;

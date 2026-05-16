import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { App as AntApp } from "antd";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROUTES } from "./constants";

// Public pages
import HomePage from "./pages/public/HomePage";
import ProjectsPage from "./pages/public/ProjectsPage";
import ProjectDetailPage from "./pages/public/ProjectDetailPage";
import ExperiencePage from "./pages/public/ExperiencePage";
import SkillsPage from "./pages/public/SkillsPage";
import CertificationsPage from "./pages/public/CertificationsPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import NotFoundPage from "./pages/public/NotFoundPage";

// Admin pages
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import ProfileSettingsPage from "./pages/admin/ProfileSettingsPage";
import ProjectsListPage from "./pages/admin/ProjectsListPage";
import ProjectFormPage from "./pages/admin/ProjectFormPage";
import AdminExperiencePage from "./pages/admin/ExperiencePage";
import AdminSkillsPage from "./pages/admin/SkillsPage";
import AdminCertificationsPage from "./pages/admin/CertificationsPage";
import MessagesPage from "./pages/admin/MessagesPage";

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
          <Route path={ROUTES.EXPERIENCE} element={<ExperiencePage />} />
          <Route path={ROUTES.SKILLS} element={<SkillsPage />} />
          <Route path={ROUTES.CERTIFICATIONS} element={<CertificationsPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />

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
          <Route
            path={ROUTES.ADMIN_EXPERIENCE}
            element={
              <ProtectedRoute>
                <AdminExperiencePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_SKILLS}
            element={
              <ProtectedRoute>
                <AdminSkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_CERTIFICATIONS}
            element={
              <ProtectedRoute>
                <AdminCertificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ADMIN_MESSAGES}
            element={
              <ProtectedRoute>
                <MessagesPage />
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

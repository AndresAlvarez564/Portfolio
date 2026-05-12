import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { App as AntApp } from "antd";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROUTES } from "./constants";

// Public pages
import HomePage from "./pages/public/HomePage";
import ProjectsPage from "./pages/public/ProjectsPage";
import NotFoundPage from "./pages/public/NotFoundPage";

// Admin pages
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";

const App = () => {
  return (
    <AntApp>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />

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

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AntApp>
  );
};

export default App;

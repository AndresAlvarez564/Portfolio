import { Outlet } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import PublicNavbar from "./PublicNavbar";

const PublicLayout = () => (
  <ConfigProvider
    theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: "#22d3ee",
        colorBgBase: "#090909",
        colorBgContainer: "rgba(255,255,255,0.04)",
        colorText: "#f9fafb",
        colorTextSecondary: "#6b7280",
        colorBorder: "rgba(255,255,255,0.1)",
        borderRadius: 10,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      },
    }}
  >
    <div style={{ background: "#090909", minHeight: "100vh" }}>
      <PublicNavbar />
      <Outlet />
    </div>
  </ConfigProvider>
);

export default PublicLayout;

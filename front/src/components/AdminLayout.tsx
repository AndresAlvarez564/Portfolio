// AdminLayout — shared layout for all protected admin pages.
// Provides a top navigation bar with the user's email and a logout button.

import { type ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App, Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import {
  DashboardOutlined,
  HistoryOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  SettingOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuthContext } from "../context/AuthContext";
import { ROUTES } from "../constants";

const { Header, Content, Sider } = Layout;

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { email, signOut } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [signingOut, setSigningOut] = useState(false);
  const selectedKey = location.pathname.startsWith(ROUTES.ADMIN_PROJECTS)
    ? ROUTES.ADMIN_PROJECTS
    : location.pathname.startsWith(ROUTES.ADMIN_EXPERIENCE)
      ? ROUTES.ADMIN_EXPERIENCE
      : location.pathname.startsWith(ROUTES.ADMIN_SKILLS)
        ? ROUTES.ADMIN_SKILLS
    : location.pathname;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate(ROUTES.ADMIN_LOGIN, { replace: true });
    } catch {
      message.error("Sign out failed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="light">
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Portfolio Admin
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={[
            {
              key: ROUTES.ADMIN_DASHBOARD,
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            {
              key: ROUTES.ADMIN_PROJECTS,
              icon: <FolderOpenOutlined />,
              label: "Projects",
            },
            {
              key: ROUTES.ADMIN_EXPERIENCE,
              icon: <HistoryOutlined />,
              label: "Experience",
            },
            {
              key: ROUTES.ADMIN_SKILLS,
              icon: <ToolOutlined />,
              label: "Skills",
            },
            {
              key: ROUTES.ADMIN_SETTINGS,
              icon: <SettingOutlined />,
              label: "Settings",
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            alignItems: "center",
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "flex-end",
            paddingInline: 24,
          }}
        >
          <Space size="middle">
            <Avatar icon={<UserOutlined />} />
          {email && (
            <Typography.Text type="secondary">
              {email}
            </Typography.Text>
          )}
          <Button
            icon={<LogoutOutlined />}
            onClick={handleSignOut}
            loading={signingOut}
            size="small"
          >
            Sign out
          </Button>
        </Space>
      </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

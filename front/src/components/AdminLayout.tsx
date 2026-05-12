// AdminLayout — shared layout for all protected admin pages.
// Provides a top navigation bar with the user's email and a logout button.

import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Button, Space, Typography, App } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useAuthContext } from "../context/AuthContext";
import { ROUTES } from "../constants";

const { Header, Content } = Layout;

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { email, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [signingOut, setSigningOut] = useState(false);

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
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between px-6 bg-white border-b border-gray-200">
        <Typography.Text strong>Portfolio Admin</Typography.Text>
        <Space>
          {email && (
            <Typography.Text type="secondary" className="text-sm">
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
      <Content className="p-6">{children}</Content>
    </Layout>
  );
};

export default AdminLayout;

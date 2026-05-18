import { Alert, Card, Col, Row, Skeleton, Space, Statistic, Typography } from "antd";
import {
  AuditOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  MailOutlined,
  PictureOutlined,
  SettingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { ROUTES } from "../../constants";
import { useAuthContext } from "../../context/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";

const quickLinks = [
  {
    title: "Projects",
    description: "Manage project cards, status, featured order, and case studies.",
    route: ROUTES.ADMIN_PROJECTS,
    icon: <FolderOpenOutlined />,
  },
  {
    title: "Experience",
    description: "Maintain timeline entries and ordering.",
    route: ROUTES.ADMIN_EXPERIENCE,
    icon: <HistoryOutlined />,
  },
  {
    title: "Skills",
    description: "Update visible skills by category.",
    route: ROUTES.ADMIN_SKILLS,
    icon: <ToolOutlined />,
  },
  {
    title: "Certifications",
    description: "Manage certifications and badge uploads.",
    route: ROUTES.ADMIN_CERTIFICATIONS,
    icon: <AuditOutlined />,
  },
  {
    title: "Media",
    description: "Review uploads and remove unused files.",
    route: ROUTES.ADMIN_MEDIA,
    icon: <PictureOutlined />,
  },
  {
    title: "Messages",
    description: "Read contact requests and update their status.",
    route: ROUTES.ADMIN_MESSAGES,
    icon: <MailOutlined />,
  },
  {
    title: "Settings",
    description: "Update public profile details, social links, and CV metadata.",
    route: ROUTES.ADMIN_SETTINGS,
    icon: <SettingOutlined />,
  },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { idToken } = useAuthContext();
  const { stats, unreadCount, loading, error } = useDashboard(idToken);

  const statCards = [
    { title: "Total Projects", value: stats.total },
    { title: "Published", value: stats.published },
    { title: "Drafts", value: stats.draft },
    { title: "Featured", value: stats.featured },
    { title: "Unread Messages", value: unreadCount },
  ];

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            Dashboard
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage portfolio content and site settings.
          </Typography.Text>
        </div>

        {error && <Alert type="warning" message={error} showIcon />}

        <Row gutter={[16, 16]}>
          {statCards.map((stat) => (
            <Col key={stat.title} xs={24} sm={12} lg={6} xl={4}>
              <Card>
                {loading ? (
                  <Skeleton active paragraph={false} />
                ) : (
                  <Statistic title={stat.title} value={stat.value} />
                )}
              </Card>
            </Col>
          ))}
        </Row>

        <div>
          <Typography.Title level={3}>Quick Links</Typography.Title>
          <Row gutter={[16, 16]}>
            {quickLinks.map((link) => (
              <Col key={link.route} xs={24} md={12} xl={8}>
                <Card hoverable onClick={() => navigate(link.route)}>
                  <Space align="start">
                    <span style={{ color: "#1677ff", fontSize: 22 }}>{link.icon}</span>
                    <div>
                      <Typography.Title level={5} style={{ marginTop: 0 }}>
                        {link.title}
                      </Typography.Title>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {link.description}
                      </Typography.Paragraph>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Space>
    </AdminLayout>
  );
};

export default DashboardPage;

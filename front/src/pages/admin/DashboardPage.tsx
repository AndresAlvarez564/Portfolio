import { Card, Col, Row, Space, Typography } from "antd";
import {
  FileTextOutlined,
  PictureOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { ROUTES } from "../../constants";

const DashboardPage = () => {
  const navigate = useNavigate();

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

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Space align="start">
                <SettingOutlined style={{ color: "#1677ff", fontSize: 22 }} />
                <div>
                  <Typography.Title level={5} style={{ marginTop: 0 }}>
                    Profile Settings
                  </Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                    Update public profile details, social links, and CV metadata.
                  </Typography.Paragraph>
                  <Typography.Link onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}>
                    Open settings
                  </Typography.Link>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Space align="start">
                <FileTextOutlined style={{ color: "#1677ff", fontSize: 22 }} />
                <div>
                  <Typography.Title level={5} style={{ marginTop: 0 }}>
                    Content
                  </Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    Projects, experience, skills, and certifications will appear here.
                  </Typography.Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Space align="start">
                <PictureOutlined style={{ color: "#1677ff", fontSize: 22 }} />
                <div>
                  <Typography.Title level={5} style={{ marginTop: 0 }}>
                    Media
                  </Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    Uploads and media library controls will be added in later tickets.
                  </Typography.Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </AdminLayout>
  );
};

export default DashboardPage;

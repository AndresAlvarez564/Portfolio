import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../../components/AdminLayout";
import { useAuthContext } from "../../context/AuthContext";
import {
  deleteProject,
  listProjectsAdmin,
  patchProject,
} from "../../services/projectsService";
import type { Project } from "../../types/project";
import { ROUTES } from "../../constants";

const ProjectsListPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      setProjects(await listProjectsAdmin(idToken));
    } catch {
      message.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, [idToken]);

  const updateProjectPatch = async (project: Project, patch: Partial<Project>) => {
    if (!idToken) return;
    try {
      const updated = await patchProject(project.projectId, patch, idToken);
      setProjects((current) =>
        current.map((item) => item.projectId === updated.projectId ? updated : item),
      );
      message.success("Project updated.");
    } catch {
      message.error("Failed to update project.");
    }
  };

  const removeProject = async (project: Project) => {
    if (!idToken) return;
    try {
      await deleteProject(project.projectId, idToken);
      setProjects((current) => current.filter((item) => item.projectId !== project.projectId));
      message.success("Project deleted.");
    } catch {
      message.error("Failed to delete project.");
    }
  };

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>
              Projects
            </Typography.Title>
            <Typography.Text type="secondary">
              Manage published and draft portfolio projects.
            </Typography.Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`${ROUTES.ADMIN_PROJECTS}/create`)}
          >
            Create Project
          </Button>
        </Space>

        <Table<Project>
          rowKey="projectId"
          loading={loading}
          dataSource={projects}
          columns={[
            {
              title: "Title",
              dataIndex: "title",
              render: (title: string, project) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{title}</Typography.Text>
                  <Typography.Text type="secondary">{project.slug}</Typography.Text>
                </Space>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (status: Project["status"]) => (
                <Tag color={status === "published" ? "green" : "default"}>
                  {status}
                </Tag>
              ),
            },
            {
              title: "Published",
              render: (_, project) => (
                <Switch
                  checked={project.status === "published"}
                  onChange={(checked) =>
                    updateProjectPatch(project, { status: checked ? "published" : "draft" })
                  }
                />
              ),
            },
            {
              title: "Featured",
              render: (_, project) => (
                <Switch
                  checked={project.featured}
                  onChange={(checked) => updateProjectPatch(project, { featured: checked })}
                />
              ),
            },
            {
              title: "Created",
              dataIndex: "createdAt",
              render: (value: string) => new Date(value).toLocaleDateString(),
            },
            {
              title: "Actions",
              render: (_, project) => (
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate(`${ROUTES.ADMIN_PROJECTS}/${project.projectId}/edit`)}
                  />
                  <Popconfirm
                    title="Delete project?"
                    description="This action cannot be undone."
                    onConfirm={() => removeProject(project)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </AdminLayout>
  );
};

export default ProjectsListPage;

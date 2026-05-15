import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Image, Space, Spin, Tag, Typography } from "antd";
import { GithubOutlined, LinkOutlined } from "@ant-design/icons";
import { getProjectBySlug } from "../../services/projectsService";
import type { Project } from "../../types/project";
import { ROUTES } from "../../constants";

const ProjectDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate(ROUTES.PROJECTS, { replace: true });
      return;
    }

    getProjectBySlug(slug)
      .then(setProject)
      .catch(() => {
        setError("Project not found.");
        navigate(ROUTES.PROJECTS, { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate, slug]);

  if (loading) {
    return (
      <main style={{ display: "grid", minHeight: "60vh", placeItems: "center" }}>
        <Spin />
      </main>
    );
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  if (!project) return null;

  return (
    <main style={{ margin: "0 auto", maxWidth: 960, padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Link to={ROUTES.PROJECTS}>Back to projects</Link>

        <div>
          <Typography.Title level={1} style={{ marginBottom: 8 }}>
            {project.title}
          </Typography.Title>
          <Space wrap>
            {project.category && <Tag color="blue">{project.category}</Tag>}
            {project.techStack?.map((tech) => <Tag key={tech}>{tech}</Tag>)}
          </Space>
        </div>

        <Typography.Paragraph style={{ fontSize: 16 }}>
          {project.description}
        </Typography.Paragraph>

        <Space wrap>
          {project.githubUrl && (
            <Button icon={<GithubOutlined />} href={project.githubUrl} target="_blank">
              GitHub
            </Button>
          )}
          {project.liveUrl && (
            <Button type="primary" icon={<LinkOutlined />} href={project.liveUrl} target="_blank">
              Live Site
            </Button>
          )}
        </Space>

        {project.screenshotUrls && project.screenshotUrls.length > 0 && (
          <Image.PreviewGroup>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {project.screenshotUrls.map((url) => (
                <Image key={url} src={url} alt={project.title} style={{ borderRadius: 8 }} />
              ))}
            </Space>
          </Image.PreviewGroup>
        )}
      </Space>
    </main>
  );
};

export default ProjectDetailPage;

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Image, Space, Spin, Tag, Typography } from "antd";
import { GithubOutlined, LinkOutlined } from "@ant-design/icons";
import { getCaseStudy, getProjectBySlug } from "../../services/projectsService";
import type { Project } from "../../types/project";
import type { CaseStudy } from "../../types/caseStudy";
import { ROUTES } from "../../constants";

const ProjectDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate(ROUTES.PROJECTS, { replace: true });
      return;
    }

    getProjectBySlug(slug)
      .then(async (projectData) => {
        setProject(projectData);
        setCaseStudy(await getCaseStudy(projectData.projectId));
      })
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

        {caseStudy && (
          <Card>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Typography.Title level={2} style={{ margin: 0 }}>
                Case Study
              </Typography.Title>
              <section>
                <Typography.Title level={4}>Problem</Typography.Title>
                <Typography.Paragraph>{caseStudy.problem}</Typography.Paragraph>
              </section>
              <section>
                <Typography.Title level={4}>Solution</Typography.Title>
                <Typography.Paragraph>{caseStudy.solution}</Typography.Paragraph>
              </section>
              <section>
                <Typography.Title level={4}>Architecture</Typography.Title>
                <Typography.Paragraph>{caseStudy.architecture}</Typography.Paragraph>
              </section>
              {caseStudy.challenges && (
                <section>
                  <Typography.Title level={4}>Challenges</Typography.Title>
                  <Typography.Paragraph>{caseStudy.challenges}</Typography.Paragraph>
                </section>
              )}
              {caseStudy.results && (
                <section>
                  <Typography.Title level={4}>Results</Typography.Title>
                  <Typography.Paragraph>{caseStudy.results}</Typography.Paragraph>
                </section>
              )}
            </Space>
          </Card>
        )}
      </Space>
    </main>
  );
};

export default ProjectDetailPage;

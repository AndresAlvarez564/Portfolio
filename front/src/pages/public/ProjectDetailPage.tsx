import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Image, Space, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined, GithubOutlined, LinkOutlined } from "@ant-design/icons";
import { getCaseStudy, getProjectBySlug } from "../../services/projectsService";
import type { Project } from "../../types/project";
import type { CaseStudy } from "../../types/caseStudy";
import { ROUTES } from "../../constants";

const techTagStyle: React.CSSProperties = {
  background: "rgba(34,211,238,0.1)",
  border: "1px solid rgba(34,211,238,0.25)",
  color: "#22d3ee",
  borderRadius: 6,
};

const CaseSection = ({ title, content }: { title: string; content?: string }) => {
  if (!content) return null;
  return (
    <section>
      <Typography.Title level={4} style={{ color: "#22d3ee", marginBottom: 8 }}>{title}</Typography.Title>
      <Typography.Paragraph style={{ color: "#d1d5db", lineHeight: 1.8, margin: 0 }}>{content}</Typography.Paragraph>
    </section>
  );
};

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
        <Spin size="large" />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 960, padding: "48px 24px" }}>
        <Alert type="error" message={error} showIcon />
      </main>
    );
  }

  if (!project) return null;

  return (
    <main style={{ margin: "0 auto", maxWidth: 960, padding: "48px 24px" }}>
      <Space direction="vertical" size={40} style={{ width: "100%" }}>

        <Link
          to={ROUTES.PROJECTS}
          style={{ alignItems: "center", color: "#6b7280", display: "inline-flex", gap: 6, fontSize: 14, textDecoration: "none" }}
        >
          <ArrowLeftOutlined /> Back to projects
        </Link>

        <div className="fade-in">
          <Typography.Title
            level={1}
            style={{ color: "#f9fafb", fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, marginBottom: 16 }}
          >
            {project.title}
          </Typography.Title>
          <Space wrap>
            {project.category && (
              <Tag style={{ ...techTagStyle, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                {project.category}
              </Tag>
            )}
            {project.techStack?.map((tech) => <Tag key={tech} style={techTagStyle}>{tech}</Tag>)}
          </Space>
        </div>

        <Typography.Paragraph style={{ color: "#d1d5db", fontSize: 17, lineHeight: 1.8, margin: 0 }}>
          {project.description}
        </Typography.Paragraph>

        <Space wrap>
          {project.githubUrl && (
            <Button icon={<GithubOutlined />} href={project.githubUrl} target="_blank">
              GitHub
            </Button>
          )}
          {project.liveUrl && (
            <Button className="btn-gradient" icon={<LinkOutlined />} href={project.liveUrl} target="_blank">
              Live Site
            </Button>
          )}
        </Space>

        {project.screenshotUrls && project.screenshotUrls.length > 0 && (
          <Image.PreviewGroup>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {project.screenshotUrls.map((url) => (
                <Image key={url} src={url} alt={project.title} style={{ borderRadius: 10 }} />
              ))}
            </Space>
          </Image.PreviewGroup>
        )}

        {caseStudy && (
          <Card className="glass-card" styles={{ body: { padding: 32 } }}>
            <Space direction="vertical" size={28} style={{ width: "100%" }}>
              <Typography.Title level={2} style={{ color: "#f9fafb", margin: 0 }}>Case Study</Typography.Title>
              <CaseSection title="Problem" content={caseStudy.problem} />
              <CaseSection title="Solution" content={caseStudy.solution} />
              <CaseSection title="Architecture" content={caseStudy.architecture} />
              <CaseSection title="Challenges" content={caseStudy.challenges} />
              <CaseSection title="Results" content={caseStudy.results} />
            </Space>
          </Card>
        )}

      </Space>
    </main>
  );
};

export default ProjectDetailPage;

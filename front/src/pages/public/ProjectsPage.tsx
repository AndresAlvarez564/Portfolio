import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, Empty, Skeleton, Space, Tag, Typography } from "antd";
import { StarFilled } from "@ant-design/icons";
import { listProjects } from "../../services/projectsService";
import type { Project } from "../../types/project";

const { Text, Title } = Typography;

const techTagStyle: React.CSSProperties = {
  background: "rgba(34,211,238,0.1)",
  border: "1px solid rgba(34,211,238,0.25)",
  color: "#22d3ee",
  borderRadius: 6,
  fontSize: 12,
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setError("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map((p) => p.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [projects]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  const filterPillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 20,
    color: active ? "#22d3ee" : "#9ca3af",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    padding: "5px 14px",
    transition: "all 0.15s ease",
    userSelect: "none" as const,
  });

  const ProjectCard = ({ project }: { project: Project }) => (
    <Link to={`/projects/${project.slug}`} style={{ textDecoration: "none" }}>
      <Card
        className="glass-card"
        cover={
          project.thumbnailUrl ? (
            <div style={{ position: "relative" }}>
              <img
                alt={project.title}
                src={project.thumbnailUrl}
                style={{ aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "12px 12px 0 0", display: "block", width: "100%" }}
              />
              {project.featured && (
                <span style={{
                  alignItems: "center",
                  background: "rgba(34,211,238,0.9)",
                  borderRadius: "0 0 0 8px",
                  color: "#020d12",
                  display: "inline-flex",
                  fontSize: 11,
                  fontWeight: 700,
                  gap: 4,
                  padding: "3px 8px",
                  position: "absolute",
                  right: 0,
                  top: 0,
                }}>
                  <StarFilled style={{ fontSize: 9 }} /> Featured
                </span>
              )}
            </div>
          ) : undefined
        }
        styles={{ body: { padding: 20 } }}
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div style={{ alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <Title level={4} style={{ color: "#f9fafb", margin: 0, flex: 1 }}>{project.title}</Title>
            {project.category && (
              <Tag style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", borderRadius: 5, fontSize: 11, flexShrink: 0 }}>
                {project.category}
              </Tag>
            )}
          </div>
          <Typography.Paragraph ellipsis={{ rows: 3 }} style={{ color: "#9ca3af", margin: 0 }}>
            {project.description}
          </Typography.Paragraph>
          <Space wrap size={[6, 6]}>
            {project.techStack?.slice(0, 5).map((tech) => (
              <Tag key={tech} style={techTagStyle}>{tech}</Tag>
            ))}
          </Space>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#22d3ee", fontSize: 13, fontWeight: 500, paddingTop: 12 }}>
            View project →
          </div>
        </Space>
      </Card>
    </Link>
  );

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: "48px 24px" }}>
      <Space direction="vertical" size={40} style={{ width: "100%" }}>

        {/* Header */}
        <div className="fade-in">
          <Text style={{ color: "#22d3ee", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Portfolio
          </Text>
          <Title
            level={1}
            style={{ color: "#f9fafb", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: 8, marginTop: 8 }}
          >
            Projects
          </Title>
          <Text style={{ color: "#6b7280", fontSize: 16 }}>
            Cloud, serverless, and application projects with architecture notes.
          </Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {/* Category filter pills */}
        {!loading && categories.length > 1 && (
          <Space wrap size={[8, 8]} className="fade-in">
            <span style={filterPillStyle(activeCategory === "all")} onClick={() => setActiveCategory("all")}>
              All ({projects.length})
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                style={filterPillStyle(activeCategory === cat)}
                onClick={() => setActiveCategory(cat)}
              >
                {cat} ({projects.filter((p) => p.category === cat).length})
              </span>
            ))}
          </Space>
        )}

        {loading ? (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {[1, 2, 3].map((i) => <Card key={i} className="glass-card" styles={{ body: { padding: 20 } }}><Skeleton active /></Card>)}
          </div>
        ) : filtered.length === 0 ? (
          <Empty description={<Text style={{ color: "#6b7280" }}>No projects in this category.</Text>} />
        ) : (
          <Space direction="vertical" size={40} style={{ width: "100%" }}>

            {/* Featured */}
            {featured.length > 0 && (
              <section className="fade-in-1">
                <Text style={{ color: "#9ca3af", display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
                  Featured
                </Text>
                <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {featured.map((p) => <ProjectCard key={p.projectId} project={p} />)}
                </div>
              </section>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <section className="fade-in-2">
                {featured.length > 0 && (
                  <Text style={{ color: "#9ca3af", display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
                    Other Projects
                  </Text>
                )}
                <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {rest.map((p) => <ProjectCard key={p.projectId} project={p} />)}
                </div>
              </section>
            )}

          </Space>
        )}
      </Space>
    </main>
  );
};

export default ProjectsPage;

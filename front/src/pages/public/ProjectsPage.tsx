import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Empty, Skeleton, Space, Tag, Typography } from "antd";
import { GithubOutlined, LinkOutlined, StarFilled } from "@ant-design/icons";
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

const ProjectCard = ({ project }: { project: Project }) => {
  const isInProgress = project.status === "in-progress";

  return (
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
              {isInProgress && (
                <span style={{
                  background: "rgba(251,191,36,0.9)",
                  borderRadius: "0 8px 0 0",
                  color: "#1a0f00",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  position: "absolute",
                  left: 0,
                  top: 0,
                }}>
                  In Progress
                </span>
              )}
            </div>
          ) : undefined
        }
        styles={{ body: { padding: 20 } }}
        style={isInProgress ? { borderColor: "rgba(251,191,36,0.2)" } : undefined}
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div style={{ alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <Title level={4} style={{ color: "#f9fafb", margin: 0, flex: 1 }}>{project.title}</Title>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
              {project.category && (
                <Tag style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", borderRadius: 5, fontSize: 11, margin: 0 }}>
                  {project.category}
                </Tag>
              )}
              {isInProgress && !project.thumbnailUrl && (
                <Tag style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", borderRadius: 5, fontSize: 11, margin: 0 }}>
                  In Progress
                </Tag>
              )}
            </div>
          </div>

          <Typography.Paragraph ellipsis={{ rows: 3 }} style={{ color: "#9ca3af", margin: 0 }}>
            {project.description}
          </Typography.Paragraph>

          <Space wrap size={[6, 6]}>
            {project.techStack?.slice(0, 5).map((tech) => (
              <Tag key={tech} style={techTagStyle}>{tech}</Tag>
            ))}
          </Space>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: "#22d3ee", fontSize: 13, fontWeight: 500 }}>
              View details →
            </span>
            {(project.githubUrl || project.liveUrl) && (
              <div
                style={{ display: "flex", gap: 6 }}
                onClick={(e) => e.stopPropagation()}
              >
                {project.githubUrl && (
                  <Button
                    size="small"
                    icon={<GithubOutlined />}
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af" }}
                  />
                )}
                {project.liveUrl && (
                  <Button
                    size="small"
                    icon={<LinkOutlined />}
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderColor: "rgba(34,211,238,0.35)", color: "#22d3ee" }}
                  />
                )}
              </div>
            )}
          </div>
        </Space>
      </Card>
    </Link>
  );
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

  const featured = filtered.filter((p) => p.featured && p.status !== "in-progress");
  const inProgress = filtered.filter((p) => p.status === "in-progress");
  const rest = filtered.filter((p) => !p.featured && p.status !== "in-progress");

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: "48px 24px" }}>
      <Space direction="vertical" size={40} style={{ width: "100%" }}>

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

            {inProgress.length > 0 && (
              <section className="fade-in-2">
                <Text style={{ color: "#fbbf24", display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
                  In Progress
                </Text>
                <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {inProgress.map((p) => <ProjectCard key={p.projectId} project={p} />)}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="fade-in-3">
                {(featured.length > 0 || inProgress.length > 0) && (
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

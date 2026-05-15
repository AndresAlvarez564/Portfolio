import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, Col, Empty, Row, Skeleton, Space, Tag, Typography } from "antd";
import { listProjects } from "../../services/projectsService";
import type { Project } from "../../types/project";

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setError("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Projects
          </Typography.Title>
          <Typography.Text type="secondary">
            Selected cloud, serverless, and application projects.
          </Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <Row gutter={[16, 16]}>
            {[1, 2, 3].map((item) => (
              <Col key={item} xs={24} md={8}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>
        ) : projects.length === 0 ? (
          <Empty description="No published projects yet." />
        ) : (
          <Row gutter={[16, 16]}>
            {projects.map((project) => (
              <Col key={project.projectId} xs={24} md={12} lg={8}>
                <Link to={`/projects/${project.slug}`}>
                  <Card
                    hoverable
                    cover={
                      project.thumbnailUrl ? (
                        <img
                          alt={project.title}
                          src={project.thumbnailUrl}
                          style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
                        />
                      ) : undefined
                    }
                  >
                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        {project.title}
                      </Typography.Title>
                      <Typography.Paragraph type="secondary" ellipsis={{ rows: 3 }}>
                        {project.description}
                      </Typography.Paragraph>
                      <Space wrap>
                        {project.techStack?.slice(0, 4).map((tech) => (
                          <Tag key={tech}>{tech}</Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </main>
  );
};

export default ProjectsPage;

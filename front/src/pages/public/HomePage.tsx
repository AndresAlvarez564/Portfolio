import { Link } from "react-router-dom";
import { Alert, Button, Card, Empty, Image, Skeleton, Space, Tag, Typography } from "antd";
import {
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import heroImage from "../../assets/hero.png";
import { ROUTES } from "../../constants";
import { useHomePage } from "../../hooks/useHomePage";
import { SKILL_CATEGORIES, type SkillCategory } from "../../types/skill";
import type { Experience } from "../../types/experience";

const { Paragraph, Text, Title } = Typography;

const categoryLabels: Record<SkillCategory, string> = {
  cloud: "Cloud",
  backend: "Backend",
  frontend: "Frontend",
  devops: "DevOps",
  databases: "Databases",
};

const formatDates = (item: Experience) => {
  const end = item.current ? "Present" : item.endDate;
  return `${item.startDate} - ${end}`;
};

const aboutPreview = (value?: string) => {
  const text = value?.trim();
  if (!text) {
    return "I build practical cloud systems while growing toward Solutions Architect work, with a focus on AWS, serverless applications, and clear architecture decisions.";
  }
  return text.split(/\n+/)[0];
};

const SectionHeader = ({ title, to }: { title: string; to?: string }) => (
  <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
    <Title level={2} style={{ margin: 0 }}>{title}</Title>
    {to && <Button type="link"><Link to={to}>View All</Link></Button>}
  </Space>
);

const HomePage = () => {
  const {
    profile,
    featuredProjects,
    experience,
    skills,
    certifications,
    loading,
    errors,
  } = useHomePage();

  const skillsByCategory = SKILL_CATEGORIES.map((category) => ({
    category,
    items: skills.filter((skill) => skill.category === category).slice(0, 6),
  })).filter((group) => group.items.length > 0);

  return (
    <main>
      <section
        style={{
          alignItems: "center",
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.96), rgba(255,255,255,0.74)), url(${heroImage})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          display: "flex",
          minHeight: "min(720px, 88vh)",
          padding: "48px 24px",
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: 1120, width: "100%" }}>
          {loading.profile ? (
            <Skeleton active paragraph={{ rows: 5 }} style={{ maxWidth: 680 }} />
          ) : profile ? (
            <Space direction="vertical" size="large" style={{ maxWidth: 760 }}>
              <div>
                <Title style={{ fontSize: 56, lineHeight: 1.05, marginBottom: 8 }}>
                  {profile.name}
                </Title>
                <Title level={2} style={{ fontWeight: 400, marginTop: 0 }}>
                  {profile.title}
                </Title>
                <Paragraph style={{ fontSize: 18, maxWidth: 680 }}>
                  {profile.summary}
                </Paragraph>
                <Text type="secondary">{profile.location}</Text>
              </div>
              <Space wrap>
                <Button type="primary"><Link to={ROUTES.PROJECTS}>View Projects</Link></Button>
                {profile.cvFileUrl && (
                  <Button icon={<DownloadOutlined />} href={profile.cvFileUrl} target="_blank" rel="noreferrer">
                    Download CV
                  </Button>
                )}
                <Button icon={<MailOutlined />}><Link to={ROUTES.CONTACT}>Contact Me</Link></Button>
              </Space>
              <Space>
                {profile.socialLinks?.github && (
                  <Button icon={<GithubOutlined />} href={profile.socialLinks.github} target="_blank" rel="noreferrer" />
                )}
                {profile.socialLinks?.linkedin && (
                  <Button icon={<LinkedinOutlined />} href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" />
                )}
              </Space>
            </Space>
          ) : (
            <Alert type="warning" message={errors.profile ?? "Profile is unavailable."} showIcon />
          )}
        </div>
      </section>

      <div style={{ margin: "0 auto", maxWidth: 1120, padding: "40px 24px" }}>
        <Space direction="vertical" size={48} style={{ width: "100%" }}>
          {loading.featuredProjects ? (
            <Skeleton active />
          ) : featuredProjects.length > 0 ? (
            <section>
              <SectionHeader title="Featured Projects" to={ROUTES.PROJECTS} />
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 20 }}>
                {featuredProjects.map((project) => (
                  <Card
                    key={project.projectId}
                    cover={project.thumbnailUrl ? <Image alt={project.title} src={project.thumbnailUrl} height={160} preview={false} style={{ objectFit: "cover" }} /> : undefined}
                  >
                    <Title level={4}>{project.title}</Title>
                    <Paragraph ellipsis={{ rows: 3 }}>{project.description}</Paragraph>
                    <Space size={[6, 6]} wrap>
                      {project.techStack.slice(0, 5).map((tech) => <Tag key={tech}>{tech}</Tag>)}
                    </Space>
                    <div style={{ marginTop: 16 }}>
                      <Link to={`/projects/${project.slug}`}>View Project</Link>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {loading.profile ? (
            <Skeleton active />
          ) : profile ? (
            <section>
              <SectionHeader title="About Me" to={ROUTES.ABOUT} />
              <Card style={{ marginTop: 20 }}>
                <Space direction="vertical" size="middle">
                  <Paragraph style={{ fontSize: 16, margin: 0 }}>
                    {aboutPreview(profile.aboutIntro)}
                  </Paragraph>
                  <Space size={[8, 8]} wrap>
                    {(profile.aboutValues?.split(/\n+/).map((item) => item.trim()).filter(Boolean) ?? [
                      "AWS-focused",
                      "Practical architecture",
                      "Reliable delivery",
                    ]).slice(0, 4).map((value) => <Tag color="blue" key={value}>{value}</Tag>)}
                  </Space>
                  <Button><Link to={ROUTES.ABOUT}>Read More</Link></Button>
                </Space>
              </Card>
            </section>
          ) : null}

          <section>
            <SectionHeader title="Experience" to={ROUTES.EXPERIENCE} />
            {loading.experience ? <Skeleton active /> : errors.experience ? (
              <Alert type="warning" message={errors.experience} showIcon />
            ) : experience.length === 0 ? (
              <Empty description="No experience entries yet." />
            ) : (
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 20 }}>
                {experience.map((item) => (
                  <Card key={item.experienceId}>
                    <Title level={4}>{item.title}</Title>
                    <Text strong>{item.company}</Text>
                    <br />
                    <Text type="secondary">{formatDates(item)}</Text>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Skills" to={ROUTES.SKILLS} />
            {loading.skills ? <Skeleton active /> : errors.skills ? (
              <Alert type="warning" message={errors.skills} showIcon />
            ) : skillsByCategory.length === 0 ? (
              <Empty description="No skills listed yet." />
            ) : (
              <Space direction="vertical" size="middle" style={{ marginTop: 20, width: "100%" }}>
                {skillsByCategory.map(({ category, items }) => (
                  <div key={category}>
                    <Text strong>{categoryLabels[category]}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Space size={[8, 8]} wrap>
                        {items.map((skill) => <Tag key={skill.skillId}>{skill.name}</Tag>)}
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </section>

          <section>
            <SectionHeader title="Certifications" to={ROUTES.CERTIFICATIONS} />
            {loading.certifications ? <Skeleton active /> : errors.certifications ? (
              <Alert type="warning" message={errors.certifications} showIcon />
            ) : certifications.length === 0 ? (
              <Empty description="No certifications listed yet." />
            ) : (
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 20 }}>
                {certifications.map((certification) => (
                  <Card key={certification.certificationId}>
                    {certification.badgeUrl && (
                      <Image src={certification.badgeUrl} alt={`${certification.name} badge`} height={80} preview={false} style={{ objectFit: "contain" }} />
                    )}
                    <Title level={4}>{certification.name}</Title>
                    <Text>{certification.issuer}</Text>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section style={{ background: "#f5f5f5", padding: 32 }}>
            <Space direction="vertical" size="middle">
              <Title level={2} style={{ margin: 0 }}>Have a project in mind?</Title>
              <Paragraph style={{ margin: 0 }}>
                Send a few details and I will get back to you with the next practical step.
              </Paragraph>
              <Button type="primary"><Link to={ROUTES.CONTACT}>Get in Touch</Link></Button>
            </Space>
          </section>
        </Space>
      </div>
    </main>
  );
};

export default HomePage;

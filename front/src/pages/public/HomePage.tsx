import { Link } from "react-router-dom";
import {
  Alert, Button, Card, Empty, Image, Skeleton, Space, Tag, Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CloudServerOutlined,
  DownloadOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
} from "@ant-design/icons";
import heroImage from "../../assets/hero.png";
import { ROUTES } from "../../constants";
import { useHomePage } from "../../hooks/useHomePage";
import { SKILL_CATEGORIES, type SkillCategory } from "../../types/skill";
import type { Experience } from "../../types/experience";

const { Paragraph, Text, Title } = Typography;

const CERTIFICATIONS_PREVIEW = 6;

const categoryLabels: Record<SkillCategory, string> = {
  cloud: "Cloud",
  backend: "Backend",
  frontend: "Frontend",
  devops: "DevOps",
  databases: "Databases",
};

const categoryAccents: Record<SkillCategory, { bg: string; border: string; color: string }> = {
  cloud:     { bg: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.25)",  color: "#22d3ee" },
  backend:   { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)",  color: "#a78bfa" },
  frontend:  { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)",  color: "#fbbf24" },
  devops:    { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)",  color: "#34d399" },
  databases: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", color: "#f87171" },
};

const techTagStyle: React.CSSProperties = {
  background: "rgba(34,211,238,0.1)",
  border: "1px solid rgba(34,211,238,0.25)",
  color: "#22d3ee",
  borderRadius: 6,
};

const cyanTagStyle: React.CSSProperties = {
  ...techTagStyle,
  fontSize: 13,
  padding: "3px 10px",
};

const formatDates = (item: Experience) => {
  const end = item.current ? "Present" : item.endDate;
  return `${item.startDate} – ${end}`;
};

const calcDuration = (item: Experience): string => {
  const parseDate = (s: string) => {
    const [month, year] = s.split("/");
    return new Date(Number(year), Number(month) - 1);
  };
  try {
    const start = parseDate(item.startDate);
    const end = item.current ? new Date() : parseDate(item.endDate ?? "");
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 1) return "";
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts: string[] = [];
    if (y > 0) parts.push(`${y}y`);
    if (m > 0) parts.push(`${m}mo`);
    return parts.join(" ");
  } catch {
    return "";
  }
};

const splitText = (value: string | undefined, fallback: string) =>
  (value?.trim() || fallback).split(/\n+/).map((s) => s.trim()).filter(Boolean);

const SectionHeader = ({
  title,
  to,
  label = "View All",
}: {
  title: string;
  to?: string;
  label?: string;
}) => (
  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
    <Title level={2} style={{ color: "#f9fafb", margin: 0 }}>{title}</Title>
    {to && (
      <Link
        to={to}
        style={{ alignItems: "center", color: "#22d3ee", display: "inline-flex", gap: 6, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
      >
        {label} <ArrowRightOutlined style={{ fontSize: 11 }} />
      </Link>
    )}
  </div>
);

/* ─── Fallback copy ───────────────────────────────────── */
const defaultAboutIntro = [
  "I focus on cloud architecture because it connects design, backend engineering, security, operations, and business outcomes.",
  "This portfolio is built as a working system, not only a static site, so each feature gives me a practical reason to make architecture decisions and document the tradeoffs.",
].join(" ");

const defaultAboutFocus =
  "My current direction is AWS-focused: serverless applications, clean API boundaries, DynamoDB access patterns, event-driven processing, media delivery, and reliable deployment practices.";

const defaultBuildItems = [
  "Portfolio CRM features with public and protected admin workflows.",
  "Backend APIs with Lambda, API Gateway, DynamoDB, SQS, and SES.",
  "Media upload flows that store images in S3 and serve them through CloudFront.",
  "Project case studies that explain architecture decisions and tradeoffs.",
];

const defaultValues = [
  "Clear documentation",
  "Practical architecture",
  "Reliable delivery",
  "Security-aware defaults",
];

/* ─── Page ────────────────────────────────────────────── */
const HomePage = () => {
  const { profile, featuredProjects, experience, skills, certifications, loading, errors } =
    useHomePage();

  const skillsByCategory = SKILL_CATEGORIES.map((category) => ({
    category,
    items: skills
      .filter((s) => s.category === category)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  const introParagraphs = splitText(profile?.aboutIntro, defaultAboutIntro);
  const focusParagraphs = splitText(profile?.aboutFocus, defaultAboutFocus);
  const buildItems      = splitText(profile?.aboutBuilds, defaultBuildItems.join("\n"));
  const valueItems      = splitText(profile?.aboutValues, defaultValues.join("\n"));

  const certsInProgress    = certifications.filter((c) => c.inProgress);
  const certsEarned        = certifications.filter((c) => !c.inProgress);
  const certsPreview       = [...certsInProgress, ...certsEarned].slice(0, CERTIFICATIONS_PREVIEW);
  const hasMoreCerts       = certifications.length > CERTIFICATIONS_PREVIEW;

  return (
    <main>
      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section
        style={{
          alignItems: "center",
          background: `radial-gradient(ellipse 70% 60% at 65% 50%, rgba(34,211,238,0.07) 0%, transparent 70%),
                       linear-gradient(rgba(9,9,9,0.88), rgba(9,9,9,0.88)),
                       url(${heroImage})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          display: "flex",
          minHeight: "min(720px, 88vh)",
          padding: "64px 24px",
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: 1120 }} className="hero-inner">
          {loading.profile ? (
            <Skeleton active paragraph={{ rows: 5 }} style={{ maxWidth: 680 }} />
          ) : profile ? (
            <>
            <Space direction="vertical" size={28} style={{ flex: 1, minWidth: 0 }}>
              <div className="fade-in">
                <h1
                  className="gradient-text"
                  style={{ fontSize: "clamp(28px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 10px" }}
                >
                  {profile.name}
                </h1>
                <h2 style={{ color: "#9ca3af", fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 400, margin: "0 0 16px" }}>
                  {profile.title}
                </h2>
                <p style={{ color: "#d1d5db", fontSize: 17, lineHeight: 1.75, maxWidth: 640, margin: "0 0 10px" }}>
                  {profile.summary}
                </p>
                <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{profile.location}</p>
              </div>

              <Space wrap className="fade-in-1">
                <Button className="btn-gradient" size="large">
                  <Link to={ROUTES.PROJECTS} style={{ color: "inherit" }}>View Projects</Link>
                </Button>
                {profile.cvFileUrl && (
                  <Button icon={<DownloadOutlined />} size="large" href={profile.cvFileUrl} target="_blank" rel="noreferrer"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#f9fafb" }}>
                    Download CV
                  </Button>
                )}
                <Button icon={<MailOutlined />} size="large">
                  <Link to={ROUTES.CONTACT} style={{ color: "inherit" }}>Contact Me</Link>
                </Button>
              </Space>

              <Space className="fade-in-2">
                {profile.socialLinks?.github && (
                  <Button icon={<GithubOutlined />} href={profile.socialLinks.github} target="_blank" rel="noreferrer"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#f9fafb" }} />
                )}
                {profile.socialLinks?.linkedin && (
                  <Button icon={<LinkedinOutlined />} href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#f9fafb" }} />
                )}
              </Space>
            </Space>
            {profile.avatarUrl && (
              <div className="fade-in" style={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
                <img src={profile.avatarUrl} alt={profile.name} className="hero-avatar" />
              </div>
            )}
            </>
          ) : (
            <Alert type="warning" message={errors.profile ?? "Profile is unavailable."} showIcon />
          )}
        </div>
      </section>

      <div style={{ margin: "0 auto", maxWidth: 1120, padding: "72px 24px" }}>
        <Space direction="vertical" size={72} style={{ width: "100%" }}>

          {/* ══════════════════════════════════════════════
              ABOUT — absorbed from /about
          ══════════════════════════════════════════════ */}
          <section>
            {loading.profile ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : profile ? (
              <Space direction="vertical" size={40} style={{ width: "100%" }}>

                {/* Bio + Cloud card */}
                <div className="fade-in about-grid">
                  <Space direction="vertical" size="large">
                    <div>
                      <Text style={{ color: "#22d3ee", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        About Me
                      </Text>
                      <Title level={2} style={{ color: "#f9fafb", marginTop: 8, marginBottom: 16 }}>
                        My Story
                      </Title>
                      {introParagraphs.map((p) => (
                        <Paragraph key={p} style={{ color: "#d1d5db", fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>
                          {p}
                        </Paragraph>
                      ))}
                    </div>
                    <Space>
                      {profile.socialLinks?.github && (
                        <Button icon={<GithubOutlined />} href={profile.socialLinks.github} target="_blank" rel="noreferrer">
                          GitHub
                        </Button>
                      )}
                      {profile.socialLinks?.linkedin && (
                        <Button icon={<LinkedinOutlined />} href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer">
                          LinkedIn
                        </Button>
                      )}
                    </Space>
                  </Space>

                  <Card className="glass-card" styles={{ body: { padding: 28 } }}>
                    <Space direction="vertical" size="middle">
                      <CloudServerOutlined style={{ color: "#22d3ee", fontSize: 40 }} />
                      <Title level={3} style={{ color: "#f9fafb", margin: 0 }}>Cloud Direction</Title>
                      {focusParagraphs.length === 1 ? (
                        <Paragraph style={{ color: "#9ca3af", margin: 0, lineHeight: 1.75 }}>
                          {focusParagraphs[0]}
                        </Paragraph>
                      ) : (
                        <Space size={[6, 8]} wrap>
                          {focusParagraphs.map((area) => (
                            <Tag key={area} style={cyanTagStyle}>{area}</Tag>
                          ))}
                        </Space>
                      )}
                    </Space>
                  </Card>
                </div>

                {/* What I Build */}
                <div className="fade-in-1">
                  <Title level={3} style={{ color: "#f9fafb", marginBottom: 20 }}>What I Build</Title>
                  <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                    {buildItems.map((item) => (
                      <Card key={item} className="glass-card" styles={{ body: { padding: 20 } }}>
                        <Paragraph style={{ color: "#9ca3af", lineHeight: 1.75, margin: 0 }}>{item}</Paragraph>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* How I Work */}
                <div className="fade-in-2">
                  <Title level={3} style={{ color: "#f9fafb", marginBottom: 16 }}>How I Work</Title>
                  <Space size={[8, 8]} wrap>
                    {valueItems.map((v) => (
                      <Tag key={v} style={cyanTagStyle}>{v}</Tag>
                    ))}
                  </Space>
                </div>

              </Space>
            ) : null}
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════════
              FEATURED PROJECTS
          ══════════════════════════════════════════════ */}
          <section className="fade-in">
            <SectionHeader title="Featured Projects" to={ROUTES.PROJECTS} label="All Projects" />
            {loading.featuredProjects ? (
              <Skeleton active />
            ) : featuredProjects.length === 0 ? (
              <Empty description={<Text style={{ color: "#6b7280" }}>No featured projects yet.</Text>} />
            ) : (
              <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {featuredProjects.map((project) => (
                  <Link key={project.projectId} to={`/projects/${project.slug}`} style={{ textDecoration: "none" }}>
                    <Card
                      className="glass-card"
                      cover={project.thumbnailUrl
                        ? <img alt={project.title} src={project.thumbnailUrl}
                            style={{ aspectRatio: "16/9", objectFit: "cover", borderRadius: "12px 12px 0 0" }} />
                        : undefined}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Title level={4} style={{ color: "#f9fafb", margin: "0 0 8px" }}>{project.title}</Title>
                      <Paragraph ellipsis={{ rows: 3 }} style={{ color: "#9ca3af", marginBottom: 14 }}>
                        {project.description}
                      </Paragraph>
                      <Space size={[6, 6]} wrap>
                        {project.techStack.slice(0, 5).map((tech) => (
                          <Tag key={tech} style={techTagStyle}>{tech}</Tag>
                        ))}
                      </Space>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#22d3ee", fontSize: 13, fontWeight: 500, marginTop: 16, paddingTop: 12 }}>
                        View case study →
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════════
              EXPERIENCE — full timeline
          ══════════════════════════════════════════════ */}
          <section className="fade-in">
            <SectionHeader title="Experience" />
            {loading.experience ? (
              <Skeleton active />
            ) : errors.experience ? (
              <Alert type="warning" message={errors.experience} showIcon />
            ) : experience.length === 0 ? (
              <Empty description={<Text style={{ color: "#6b7280" }}>No experience entries yet.</Text>} />
            ) : (
              <div style={{ position: "relative" }}>
                {/* Timeline spine */}
                <div style={{
                  background: "linear-gradient(180deg, #22d3ee 0%, rgba(34,211,238,0.15) 100%)",
                  bottom: 24,
                  left: 15,
                  position: "absolute",
                  top: 8,
                  width: 2,
                }} />
                <Space direction="vertical" size={20} style={{ paddingLeft: 52, width: "100%" }}>
                  {experience.map((item, idx) => {
                    const duration = calcDuration(item);
                    return (
                      <div key={item.experienceId} style={{ position: "relative" }}>
                        {/* Dot */}
                        <div style={{
                          background: item.current ? "#22d3ee" : "#374151",
                          border: "2px solid #22d3ee",
                          borderRadius: "50%",
                          boxShadow: item.current ? "0 0 12px rgba(34,211,238,0.7)" : "none",
                          height: 14,
                          left: -45,
                          position: "absolute",
                          top: 20,
                          width: 14,
                        }} />
                        <Card className="glass-card" styles={{ body: { padding: 0 } }} style={{ animationDelay: `${idx * 0.06}s` }}>
                          <div style={{ display: "flex" }}>
                            <div style={{
                              background: item.current
                                ? "linear-gradient(180deg, #22d3ee, rgba(34,211,238,0.3))"
                                : "rgba(255,255,255,0.06)",
                              borderRadius: "12px 0 0 12px",
                              flexShrink: 0,
                              width: 4,
                            }} />
                            <div style={{ padding: "22px 26px", width: "100%" }}>
                              <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 10 }}>
                                <div>
                                  <Title level={4} style={{ color: "#f9fafb", margin: "0 0 4px" }}>{item.title}</Title>
                                  <Text strong style={{ color: "#22d3ee", fontSize: 15 }}>{item.company}</Text>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>{formatDates(item)}</div>
                                  <div style={{ alignItems: "center", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                    {duration && <span style={{ color: "#4b5563", fontSize: 12 }}>{duration}</span>}
                                    {item.current && (
                                      <span style={{
                                        background: "rgba(34,211,238,0.12)",
                                        border: "1px solid rgba(34,211,238,0.3)",
                                        borderRadius: 4,
                                        color: "#22d3ee",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                        padding: "2px 8px",
                                        textTransform: "uppercase",
                                      }}>
                                        Current
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {item.description && (
                                <Paragraph style={{ color: "#9ca3af", lineHeight: 1.8, marginBottom: 0 }}>
                                  {item.description}
                                </Paragraph>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </Space>
              </div>
            )}
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════════
              SKILLS — full list (replaces /skills page)
          ══════════════════════════════════════════════ */}
          <section className="fade-in">
            <SectionHeader title="Skills" />
            {loading.skills ? (
              <Skeleton active />
            ) : errors.skills ? (
              <Alert type="warning" message={errors.skills} showIcon />
            ) : skillsByCategory.length === 0 ? (
              <Empty description={<Text style={{ color: "#6b7280" }}>No skills listed yet.</Text>} />
            ) : (
              <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {skillsByCategory.map(({ category, items }) => {
                  const accent = categoryAccents[category];
                  return (
                    <div key={category}>
                      <Text style={{
                        color: accent.color,
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        marginBottom: 12,
                        textTransform: "uppercase",
                      }}>
                        {categoryLabels[category]}
                      </Text>
                      <Space size={[8, 8]} wrap>
                        {items.map((skill) => (
                          <Tag key={skill.skillId} style={{
                            background: accent.bg,
                            border: `1px solid ${accent.border}`,
                            color: accent.color,
                            borderRadius: 6,
                            fontSize: 13,
                            padding: "3px 10px",
                          }}>
                            {skill.name}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <hr className="section-divider" />

          {/* ══════════════════════════════════════════════
              CERTIFICATIONS
          ══════════════════════════════════════════════ */}
          <section className="fade-in">
            <SectionHeader title="Certifications" to={hasMoreCerts ? ROUTES.CERTIFICATIONS : undefined} />
            {loading.certifications ? (
              <Skeleton active />
            ) : errors.certifications ? (
              <Alert type="warning" message={errors.certifications} showIcon />
            ) : certsPreview.length === 0 ? (
              <Empty description={<Text style={{ color: "#6b7280" }}>No certifications listed yet.</Text>} />
            ) : (
              <>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {certsPreview.map((cert) => (
                    <Card
                      key={cert.certificationId}
                      className="glass-card"
                      styles={{ body: { padding: 20, textAlign: "center" } }}
                      style={cert.inProgress ? { borderColor: "rgba(251,191,36,0.2)" } : undefined}
                    >
                      <div style={{ alignItems: "center", display: "flex", height: 72, justifyContent: "center", marginBottom: 12 }}>
                        {cert.badgeUrl
                          ? <Image src={cert.badgeUrl} alt={`${cert.name} badge`} height={72} preview={false} style={{ objectFit: "contain" }} />
                          : <span style={{ color: cert.inProgress ? "#fbbf24" : "#22d3ee", fontSize: 36 }}>✦</span>
                        }
                      </div>
                      <Title level={5} style={{ color: "#f9fafb", margin: "0 0 4px" }}>{cert.name}</Title>
                      <Text style={{ color: "#22d3ee", fontSize: 13 }}>{cert.issuer}</Text>
                      {cert.inProgress && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 4, color: "#fbbf24", fontSize: 11, fontWeight: 600, padding: "2px 8px" }}>
                            Studying
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                {hasMoreCerts && (
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    <Link to={ROUTES.CERTIFICATIONS}
                      style={{ alignItems: "center", color: "#6b7280", display: "inline-flex", fontSize: 14, gap: 6, textDecoration: "none" }}>
                      View all {certifications.length} certifications <ArrowRightOutlined style={{ fontSize: 11 }} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ══════════════════════════════════════════════
              CTA BANNER
          ══════════════════════════════════════════════ */}
          <section className="cta-banner fade-in">
            <Space direction="vertical" size="middle">
              <Title level={2} style={{ color: "#f9fafb", margin: 0 }}>Have a project in mind?</Title>
              <Paragraph style={{ color: "#9ca3af", fontSize: 16, margin: 0 }}>
                Send a few details and I will get back to you with the next practical step.
              </Paragraph>
              <Button className="btn-gradient" size="large">
                <Link to={ROUTES.CONTACT} style={{ color: "inherit" }}>Get in Touch</Link>
              </Button>
            </Space>
          </section>

        </Space>
      </div>
    </main>
  );
};

export default HomePage;

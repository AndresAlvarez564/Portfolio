import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Empty, Skeleton, Space, Tag, Typography } from "antd";
import {
  CloudServerOutlined,
  DownloadOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { getProfile } from "../../services/profileService";
import { ROUTES } from "../../constants";
import type { ProfileData } from "../../types/profile";

const { Paragraph, Text, Title } = Typography;

const focusAreas = [
  "AWS serverless",
  "API design",
  "DynamoDB data modeling",
  "Infrastructure as code",
  "Security basics",
  "Operational visibility",
];

const buildAreas = [
  "Portfolio CRM features with public and protected admin workflows.",
  "Backend APIs with Lambda, API Gateway, DynamoDB, SQS, and SES.",
  "Media upload flows that store images in S3 and serve them through CloudFront.",
  "Project case studies that explain architecture decisions and tradeoffs.",
];

const workValues = [
  "Clear documentation",
  "Practical architecture",
  "Reliable delivery",
  "Security-aware defaults",
];

const defaultAboutIntro = [
  "I focus on cloud architecture because it connects design, backend engineering, security, operations, and business outcomes.",
  "This portfolio is built as a working system, not only a static site, so each feature gives me a practical reason to make architecture decisions and document the tradeoffs.",
].join(" ");

const defaultAboutFocus = "My current direction is AWS-focused: serverless applications, clean API boundaries, DynamoDB access patterns, event-driven processing, media delivery, and reliable deployment practices.";

const splitEditableText = (value: string | undefined, fallback: string) =>
  (value?.trim() || fallback).split(/\n+/).map((item) => item.trim()).filter(Boolean);

const tagStyle: React.CSSProperties = {
  background: "rgba(34,211,238,0.1)",
  border: "1px solid rgba(34,211,238,0.25)",
  color: "#22d3ee",
  borderRadius: 6,
  fontSize: 13,
  padding: "3px 10px",
};

const AboutPage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((data) => { if (mounted) setProfile(data); })
      .catch(() => { if (mounted) setError("About profile is unavailable."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: 40 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: 40 }}>
        <Alert type="error" message={error} showIcon />
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: 40 }}>
        <Empty description={<Text style={{ color: "#6b7280" }}>About profile is unavailable.</Text>} />
      </main>
    );
  }

  const introParagraphs = splitEditableText(profile.aboutIntro, defaultAboutIntro);
  const focusParagraphs = splitEditableText(profile.aboutFocus, defaultAboutFocus);
  const buildItems = splitEditableText(profile.aboutBuilds, buildAreas.join("\n"));
  const valueItems = splitEditableText(profile.aboutValues, workValues.join("\n"));

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: "48px 24px" }}>
      <Space direction="vertical" size={56} style={{ width: "100%" }}>

        {/* ── Hero section ───────────────────── */}
        <section
          className="fade-in"
          style={{ display: "grid", gap: 28, gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)" }}
        >
          <Space direction="vertical" size="large">
            <div>
              <Text style={{ color: "#6b7280", fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {profile.location}
              </Text>
              <h1
                className="gradient-text"
                style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.08, marginBottom: 8, marginTop: 8 }}
              >
                {profile.name}
              </h1>
              <h2 style={{ color: "#9ca3af", fontSize: "clamp(16px, 2vw, 22px)", fontWeight: 400, marginTop: 0, marginBottom: 16 }}>
                {profile.title}
              </h2>
              <Paragraph style={{ color: "#d1d5db", fontSize: 17, lineHeight: 1.75, maxWidth: 640, margin: 0 }}>
                {profile.summary}
              </Paragraph>
            </div>

            <Space wrap>
              <Button className="btn-gradient">
                <Link to={ROUTES.PROJECTS} style={{ color: "inherit" }}>View Projects</Link>
              </Button>
              <Button icon={<MailOutlined />}>
                <Link to={ROUTES.CONTACT} style={{ color: "inherit" }}>Contact Me</Link>
              </Button>
              <Button icon={<SafetyCertificateOutlined />}>
                <Link to={ROUTES.CERTIFICATIONS} style={{ color: "inherit" }}>Certifications</Link>
              </Button>
              {profile.cvFileUrl && (
                <Button icon={<DownloadOutlined />} href={profile.cvFileUrl} target="_blank" rel="noreferrer">
                  Download CV
                </Button>
              )}
            </Space>

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

          {/* Cloud direction card */}
          <Card className="glass-card" styles={{ body: { padding: 28 } }}>
            <Space direction="vertical" size="middle">
              <CloudServerOutlined style={{ color: "#22d3ee", fontSize: 40 }} />
              <Title level={3} style={{ color: "#f9fafb", margin: 0 }}>Cloud direction</Title>
              <Paragraph style={{ color: "#9ca3af", margin: 0, lineHeight: 1.7 }}>
                {focusParagraphs[0]}
              </Paragraph>
            </Space>
          </Card>
        </section>

        <hr className="section-divider" />

        {/* ── My Path ────────────────────────── */}
        <section className="fade-in">
          <Title level={2} style={{ color: "#f9fafb" }}>My Path</Title>
          {introParagraphs.map((paragraph) => (
            <Paragraph key={paragraph} style={{ color: "#d1d5db", fontSize: 16, lineHeight: 1.8 }}>
              {paragraph}
            </Paragraph>
          ))}
          {focusParagraphs.slice(1).map((paragraph) => (
            <Paragraph key={paragraph} style={{ color: "#d1d5db", fontSize: 16, lineHeight: 1.8 }}>
              {paragraph}
            </Paragraph>
          ))}
        </section>

        {/* ── Cloud Focus Tags ────────────────── */}
        <section className="fade-in">
          <Title level={2} style={{ color: "#f9fafb" }}>Cloud &amp; AWS Focus</Title>
          <Space size={[8, 8]} wrap>
            {focusAreas.map((area) => <Tag key={area} style={tagStyle}>{area}</Tag>)}
          </Space>
        </section>

        {/* ── What I Build ────────────────────── */}
        <section className="fade-in">
          <Title level={2} style={{ color: "#f9fafb" }}>What I Build</Title>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {buildItems.map((area) => (
              <Card key={area} className="glass-card" styles={{ body: { padding: 20 } }}>
                <Paragraph style={{ color: "#9ca3af", margin: 0, lineHeight: 1.7 }}>{area}</Paragraph>
              </Card>
            ))}
          </div>
        </section>

        {/* ── How I Work ──────────────────────── */}
        <section className="fade-in">
          <Title level={2} style={{ color: "#f9fafb" }}>How I Work</Title>
          <Space size={[8, 8]} wrap>
            {valueItems.map((value) => <Tag key={value} style={tagStyle}>{value}</Tag>)}
          </Space>
        </section>

        {/* ── CTA Banner ──────────────────────── */}
        <section className="cta-banner fade-in">
          <Space direction="vertical" size="middle">
            <Title level={2} style={{ color: "#f9fafb", margin: 0 }}>See the work behind the profile</Title>
            <Paragraph style={{ color: "#9ca3af", margin: 0, fontSize: 16 }}>
              The best way to evaluate my progress is through the projects, architecture notes, and case studies in this portfolio.
            </Paragraph>
            <Space wrap>
              <Button className="btn-gradient">
                <Link to={ROUTES.PROJECTS} style={{ color: "inherit" }}>Explore Projects</Link>
              </Button>
              <Button>
                <Link to={ROUTES.CONTACT} style={{ color: "inherit" }}>Start a Conversation</Link>
              </Button>
            </Space>
          </Space>
        </section>

      </Space>
    </main>
  );
};

export default AboutPage;

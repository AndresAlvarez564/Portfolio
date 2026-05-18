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

const AboutPage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getProfile()
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch(() => {
        if (mounted) setError("About profile is unavailable.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: 24 }}>
        <Alert type="error" message={error} showIcon />
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: 24 }}>
        <Empty description="About profile is unavailable." />
      </main>
    );
  }

  const introParagraphs = splitEditableText(profile.aboutIntro, defaultAboutIntro);
  const focusParagraphs = splitEditableText(profile.aboutFocus, defaultAboutFocus);
  const buildItems = splitEditableText(profile.aboutBuilds, buildAreas.join("\n"));
  const valueItems = splitEditableText(profile.aboutValues, workValues.join("\n"));

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: 24 }}>
      <Space direction="vertical" size={40} style={{ width: "100%" }}>
        <section style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)" }}>
          <Space direction="vertical" size="large">
            <div>
              <Text type="secondary">{profile.location}</Text>
              <Title style={{ marginBottom: 8 }}>{profile.name}</Title>
              <Title level={2} style={{ fontWeight: 400, marginTop: 0 }}>
                {profile.title}
              </Title>
              <Paragraph style={{ fontSize: 17, maxWidth: 720 }}>
                {profile.summary}
              </Paragraph>
            </div>

            <Space wrap>
              <Button type="primary"><Link to={ROUTES.PROJECTS}>View Projects</Link></Button>
              <Button icon={<MailOutlined />}><Link to={ROUTES.CONTACT}>Contact Me</Link></Button>
              <Button icon={<SafetyCertificateOutlined />}><Link to={ROUTES.CERTIFICATIONS}>Certifications</Link></Button>
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

          <Card>
            <Space direction="vertical" size="middle">
              <CloudServerOutlined style={{ color: "#1677ff", fontSize: 36 }} />
              <Title level={3} style={{ margin: 0 }}>Cloud direction</Title>
              <Paragraph style={{ margin: 0 }}>
                {focusParagraphs[0]}
              </Paragraph>
            </Space>
          </Card>
        </section>

        <section>
          <Title level={2}>My Path</Title>
          {introParagraphs.map((paragraph) => (
            <Paragraph key={paragraph} style={{ fontSize: 16 }}>
              {paragraph}
            </Paragraph>
          ))}
          {focusParagraphs.slice(1).map((paragraph) => (
            <Paragraph key={paragraph} style={{ fontSize: 16 }}>
              {paragraph}
            </Paragraph>
          ))}
        </section>

        <section>
          <Title level={2}>Cloud And AWS Focus</Title>
          <Space size={[8, 8]} wrap>
            {focusAreas.map((area) => <Tag key={area}>{area}</Tag>)}
          </Space>
        </section>

        <section>
          <Title level={2}>What I Build</Title>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {buildItems.map((area) => (
              <Card key={area}>
                <Paragraph style={{ margin: 0 }}>{area}</Paragraph>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Title level={2}>How I Work</Title>
          <Space size={[8, 8]} wrap>
            {valueItems.map((value) => <Tag color="blue" key={value}>{value}</Tag>)}
          </Space>
        </section>

        <section style={{ background: "#f5f5f5", padding: 32 }}>
          <Space direction="vertical" size="middle">
            <Title level={2} style={{ margin: 0 }}>See the work behind the profile</Title>
            <Paragraph style={{ margin: 0 }}>
              The best way to evaluate my progress is through the projects, architecture notes, and case studies in this portfolio.
            </Paragraph>
            <Space wrap>
              <Button type="primary"><Link to={ROUTES.PROJECTS}>Explore Projects</Link></Button>
              <Button><Link to={ROUTES.CONTACT}>Start a Conversation</Link></Button>
            </Space>
          </Space>
        </section>
      </Space>
    </main>
  );
};

export default AboutPage;

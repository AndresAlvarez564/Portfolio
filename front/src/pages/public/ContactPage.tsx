import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, Result, Space, Typography } from "antd";
import {
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  EnvironmentOutlined,
  WhatsAppOutlined,
  GlobalOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { submitContact } from "../../services/contactService";
import { getProfile } from "../../services/profileService";
import type { ContactFormData } from "../../types/contact";
import type { ProfileData } from "../../types/profile";

const { Text, Title } = Typography;

const schema = yup.object({
  name: yup.string().required("Name is required.").max(120),
  email: yup.string().required("Email is required.").email("Enter a valid email.").max(254),
  phone: yup.string().defined().default("").max(30),
  company: yup.string().defined().default("").max(160),
  projectType: yup.string().defined().default("").max(120),
  budget: yup.string().defined().default("").max(80),
  subject: yup.string().required("Subject is required.").max(180),
  message: yup.string().required("Message is required.").max(2000),
  website: yup.string().defined().default(""),
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  name: "", email: "", phone: "", company: "", projectType: "",
  budget: "", subject: "", message: "", website: "",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f9fafb",
  borderRadius: 8,
};

const waUrl = (num: string) =>
  `https://wa.me/${num.replace(/[^\d]/g, "")}`;

const InfoRow = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ alignItems: "flex-start", display: "flex", gap: 12 }}>
    <span style={{ color: "#22d3ee", fontSize: 16, marginTop: 2, flexShrink: 0 }}>{icon}</span>
    <span style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.6 }}>{children}</span>
  </div>
);

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => null);
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues, resolver: yupResolver(schema) });

  const submit = async (values: ContactFormData) => {
    setSubmitError(null);
    try {
      await submitContact(values);
      setSubmitted(true);
    } catch {
      setSubmitError("Failed to send your message. Please try again.");
    }
  };

  if (submitted) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 1120, padding: "48px 24px" }}>
        <Result
          status="success"
          title={<span style={{ color: "#f9fafb" }}>Message sent.</span>}
          subTitle={<span style={{ color: "#9ca3af" }}>Thanks for reaching out. I will follow up as soon as possible.</span>}
        />
      </main>
    );
  }

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: "48px 24px" }}>
      <Space direction="vertical" size={40} style={{ width: "100%" }}>

        {/* Header */}
        <div className="fade-in">
          <Text style={{ color: "#22d3ee", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Let's Talk
          </Text>
          <Title
            level={1}
            style={{ color: "#f9fafb", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: 8, marginTop: 8 }}
          >
            Contact
          </Title>
          <Text style={{ color: "#6b7280", fontSize: 16 }}>
            Share the project details and the best way to reach you.
          </Text>
        </div>

        {submitError && <Alert type="error" message={submitError} showIcon />}

        {/* Two-column layout */}
        <div
          className="fade-in-1 contact-grid"
        >
          {/* Left — contact info card */}
          <Card className="glass-card" styles={{ body: { padding: 28 } }}>
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
              <div>
                <Text style={{ color: "#22d3ee", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Get in Touch
                </Text>
                {profile?.contactNote && (
                  <Text style={{ color: "#9ca3af", fontSize: 13, display: "block", marginTop: 10, lineHeight: 1.6 }}>
                    {profile.contactNote}
                  </Text>
                )}
              </div>

              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {profile?.contactEmail && (
                  <InfoRow icon={<MailOutlined />}>
                    <a href={`mailto:${profile.contactEmail}`} style={{ color: "#d1d5db", textDecoration: "none" }}>
                      {profile.contactEmail}
                    </a>
                  </InfoRow>
                )}

                {profile?.whatsapp && (
                  <InfoRow icon={<WhatsAppOutlined />}>
                    <a href={waUrl(profile.whatsapp)} target="_blank" rel="noreferrer" style={{ color: "#d1d5db", textDecoration: "none" }}>
                      {profile.whatsapp}
                    </a>
                  </InfoRow>
                )}

                {profile?.location && (
                  <InfoRow icon={<EnvironmentOutlined />}>
                    {profile.location}
                  </InfoRow>
                )}
              </Space>

              {/* Social links */}
              {(profile?.socialLinks?.github || profile?.socialLinks?.linkedin ||
                profile?.socialLinks?.twitter || profile?.socialLinks?.website) && (
                <div>
                  <Text style={{ color: "#4b5563", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                    Social
                  </Text>
                  <Space wrap size={8}>
                    {profile?.socialLinks?.github && (
                      <Button size="small" icon={<GithubOutlined />} href={profile.socialLinks.github} target="_blank" rel="noreferrer"
                        style={{ borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af" }}>
                        GitHub
                      </Button>
                    )}
                    {profile?.socialLinks?.linkedin && (
                      <Button size="small" icon={<LinkedinOutlined />} href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer"
                        style={{ borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af" }}>
                        LinkedIn
                      </Button>
                    )}
                    {profile?.socialLinks?.twitter && (
                      <Button size="small" icon={<TwitterOutlined />} href={profile.socialLinks.twitter} target="_blank" rel="noreferrer"
                        style={{ borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af" }}>
                        Twitter
                      </Button>
                    )}
                    {profile?.socialLinks?.website && (
                      <Button size="small" icon={<GlobalOutlined />} href={profile.socialLinks.website} target="_blank" rel="noreferrer"
                        style={{ borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af" }}>
                        Website
                      </Button>
                    )}
                  </Space>
                </div>
              )}
            </Space>
          </Card>

          {/* Right — form */}
          <Form layout="vertical" onFinish={handleSubmit(submit)}>
            <Form.Item label={<span style={{ color: "#d1d5db" }}>Name</span>}
              validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
              <Controller name="name" control={control}
                render={({ field }) => <Input {...field} style={inputStyle} />} />
            </Form.Item>

            <Space style={{ width: "100%" }} size="middle" align="start">
              <Form.Item label={<span style={{ color: "#d1d5db" }}>Email</span>}
                validateStatus={errors.email ? "error" : ""} help={errors.email?.message}
                style={{ flex: 1 }}>
                <Controller name="email" control={control}
                  render={({ field }) => <Input {...field} style={inputStyle} />} />
              </Form.Item>
              <Form.Item
                label={<span style={{ color: "#d1d5db" }}>Phone <span style={{ color: "#4b5563", fontWeight: 400 }}>(optional)</span></span>}
                validateStatus={errors.phone ? "error" : ""} help={errors.phone?.message}
                style={{ flex: 1 }}>
                <Controller name="phone" control={control}
                  render={({ field }) => <Input {...field} placeholder="+1 (555) 000-0000" style={inputStyle} />} />
              </Form.Item>
            </Space>

            <Space style={{ width: "100%" }} size="middle" align="start">
              <Form.Item label={<span style={{ color: "#d1d5db" }}>Company</span>}
                validateStatus={errors.company ? "error" : ""} help={errors.company?.message}
                style={{ flex: 1 }}>
                <Controller name="company" control={control}
                  render={({ field }) => <Input {...field} style={inputStyle} />} />
              </Form.Item>
              <Form.Item label={<span style={{ color: "#d1d5db" }}>Budget</span>}
                validateStatus={errors.budget ? "error" : ""} help={errors.budget?.message}
                style={{ flex: 1 }}>
                <Controller name="budget" control={control}
                  render={({ field }) => <Input {...field} style={inputStyle} />} />
              </Form.Item>
            </Space>

            <Form.Item label={<span style={{ color: "#d1d5db" }}>Project Type</span>}
              validateStatus={errors.projectType ? "error" : ""} help={errors.projectType?.message}>
              <Controller name="projectType" control={control}
                render={({ field }) => <Input {...field} style={inputStyle} />} />
            </Form.Item>

            <Form.Item label={<span style={{ color: "#d1d5db" }}>Subject</span>}
              validateStatus={errors.subject ? "error" : ""} help={errors.subject?.message}>
              <Controller name="subject" control={control}
                render={({ field }) => <Input {...field} style={inputStyle} />} />
            </Form.Item>

            <Form.Item label={<span style={{ color: "#d1d5db" }}>Message</span>}
              validateStatus={errors.message ? "error" : ""} help={errors.message?.message}>
              <Controller name="message" control={control}
                render={({ field }) => <Input.TextArea rows={7} {...field} style={inputStyle} />} />
            </Form.Item>

            {/* Honeypot */}
            <div aria-hidden="true" style={{ height: 0, left: -10000, overflow: "hidden", position: "absolute", width: 0 }}>
              <Controller name="website" control={control}
                render={({ field }) => <Input {...field} tabIndex={-1} autoComplete="off" />} />
            </div>

            <Button className="btn-gradient" size="large" htmlType="submit" loading={isSubmitting}>
              Send Message
            </Button>
          </Form>
        </div>

      </Space>
    </main>
  );
};

export default ContactPage;

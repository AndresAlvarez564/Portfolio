import { useEffect, useState } from "react";
import { Typography, Spin, Alert } from "antd";
import { getProfile } from "../../services/profileService";
import type { ProfileData } from "../../types/profile";

const { Title, Paragraph, Text } = Typography;

const AboutPage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;
  if (!profile) return null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <Title>{profile.name}</Title>
      <Text type="secondary">{profile.title}</Text>
      <Paragraph style={{ marginTop: 16 }}>{profile.summary}</Paragraph>
      <Paragraph>📍 {profile.location}</Paragraph>

      {profile.cvFileUrl && (
        <a href={profile.cvFileUrl} target="_blank" rel="noopener noreferrer">
          Download CV
        </a>
      )}

      <div style={{ marginTop: 16 }}>
        {profile.socialLinks?.github && (
          <div><a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer">GitHub</a></div>
        )}
        {profile.socialLinks?.linkedin && (
          <div><a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></div>
        )}
        {profile.socialLinks?.twitter && (
          <div><a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a></div>
        )}
        {profile.socialLinks?.website && (
          <div><a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">Website</a></div>
        )}
      </div>
    </div>
  );
};

export default AboutPage;

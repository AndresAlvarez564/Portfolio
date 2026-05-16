import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Image, Space, Spin, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { listCertifications } from "../../services/certificationsService";
import type { Certification } from "../../types/certification";

const formatDate = (value?: string) => value || "No expiration";

const CertificationsPage = () => {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCertifications()
      .then(setItems)
      .catch(() => setError("Failed to load certifications."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Certifications
          </Typography.Title>
          <Typography.Text type="secondary">
            Professional credentials and verifiable achievements.
          </Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <div style={{ display: "grid", minHeight: 220, placeItems: "center" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="No certifications listed yet." />
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {items.map((item) => (
              <Card key={item.certificationId}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <div style={{ alignItems: "center", display: "flex", height: 96, justifyContent: "center" }}>
                    {item.badgeUrl ? (
                      <Image
                        src={item.badgeUrl}
                        alt={`${item.name} badge`}
                        height={96}
                        preview={false}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <SafetyCertificateOutlined style={{ color: "#8c8c8c", fontSize: 48 }} />
                    )}
                  </div>
                  <div>
                    <Typography.Title level={4} style={{ marginBottom: 4 }}>
                      {item.name}
                    </Typography.Title>
                    <Typography.Text strong>{item.issuer}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">
                      Issued {item.issueDate} · Expires {formatDate(item.expirationDate)}
                    </Typography.Text>
                  </div>
                  {item.verificationUrl && (
                    <Button href={item.verificationUrl} target="_blank" rel="noreferrer">
                      Verify
                    </Button>
                  )}
                </Space>
              </Card>
            ))}
          </div>
        )}
      </Space>
    </main>
  );
};

export default CertificationsPage;

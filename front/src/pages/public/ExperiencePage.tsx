import { useEffect, useState } from "react";
import { Alert, Card, Empty, Space, Spin, Timeline, Typography } from "antd";
import { listExperience } from "../../services/experienceService";
import type { Experience } from "../../types/experience";

const formatDates = (item: Experience) => {
  const end = item.current ? "Present" : item.endDate;
  return `${item.startDate} - ${end}`;
};

const ExperiencePage = () => {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExperience()
      .then(setItems)
      .catch(() => setError("Failed to load experience."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ margin: "0 auto", maxWidth: 960, padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Experience
          </Typography.Title>
          <Typography.Text type="secondary">
            Professional roles and hands-on delivery experience.
          </Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <div style={{ display: "grid", minHeight: 220, placeItems: "center" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="No experience entries yet." />
        ) : (
          <Timeline
            items={items.map((item) => ({
              children: (
                <Card>
                  <Typography.Title level={4} style={{ marginBottom: 4 }}>
                    {item.title}
                  </Typography.Title>
                  <Typography.Text strong>{item.company}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">{formatDates(item)}</Typography.Text>
                  <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                    {item.description}
                  </Typography.Paragraph>
                </Card>
              ),
            }))}
          />
        )}
      </Space>
    </main>
  );
};

export default ExperiencePage;

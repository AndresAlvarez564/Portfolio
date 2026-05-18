import { useEffect, useState } from "react";
import { Alert, Card, Empty, Space, Spin, Typography } from "antd";
import { listExperience } from "../../services/experienceService";
import type { Experience } from "../../types/experience";

const { Text, Title } = Typography;

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
    <main style={{ margin: "0 auto", maxWidth: 960, padding: "48px 24px" }}>
      <Space direction="vertical" size={48} style={{ width: "100%" }}>

        <div className="fade-in">
          <Text style={{ color: "#22d3ee", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Career Timeline
          </Text>
          <Title
            level={1}
            style={{ color: "#f9fafb", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: 8, marginTop: 8 }}
          >
            Experience
          </Title>
          <Text style={{ color: "#6b7280", fontSize: 16 }}>
            Professional roles and hands-on delivery experience.
          </Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <div style={{ display: "grid", minHeight: 220, placeItems: "center" }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description={<Text style={{ color: "#6b7280" }}>No experience entries yet.</Text>} />
        ) : (
          <div className="fade-in-1" style={{ position: "relative" }}>
            {/* Timeline spine */}
            <div style={{
              background: "linear-gradient(180deg, #22d3ee 0%, rgba(34,211,238,0.15) 100%)",
              bottom: 24,
              left: 15,
              position: "absolute",
              top: 8,
              width: 2,
            }} />

            <Space direction="vertical" size={24} style={{ paddingLeft: 52, width: "100%" }}>
              {items.map((item, idx) => {
                const duration = calcDuration(item);
                return (
                  <div key={item.experienceId} style={{ position: "relative" }}>
                    {/* Timeline dot */}
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

                    <Card
                      className="glass-card"
                      styles={{ body: { padding: 0 } }}
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <div style={{ display: "flex" }}>
                        {/* Accent bar */}
                        <div style={{
                          background: item.current
                            ? "linear-gradient(180deg, #22d3ee, rgba(34,211,238,0.3))"
                            : "rgba(255,255,255,0.06)",
                          borderRadius: "12px 0 0 12px",
                          flexShrink: 0,
                          width: 4,
                        }} />
                        <div style={{ padding: "22px 26px", width: "100%" }}>

                          {/* Header row */}
                          <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 12 }}>
                            <div>
                              <Title level={4} style={{ color: "#f9fafb", margin: "0 0 4px" }}>
                                {item.title}
                              </Title>
                              <Text strong style={{ color: "#22d3ee", fontSize: 15 }}>
                                {item.company}
                              </Text>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
                                {formatDates(item)}
                              </div>
                              <div style={{ alignItems: "center", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                {duration && (
                                  <span style={{ color: "#4b5563", fontSize: 12 }}>{duration}</span>
                                )}
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

                          {/* Description */}
                          {item.description && (
                            <Typography.Paragraph style={{ color: "#9ca3af", lineHeight: 1.8, marginBottom: 0 }}>
                              {item.description}
                            </Typography.Paragraph>
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
      </Space>
    </main>
  );
};

export default ExperiencePage;

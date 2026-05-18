import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Image, Space, Spin, Tag, Typography } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { listCertifications } from "../../services/certificationsService";
import type { Certification } from "../../types/certification";

const { Text, Title } = Typography;

const parseDate = (s?: string) => {
  if (!s) return null;
  const [m, y] = s.split("/");
  const n = new Date(Number(y), Number(m) - 1);
  return isNaN(n.getTime()) ? null : n;
};

type CertStatus = "active" | "expiring" | "expired" | "permanent" | "studying";

const getCertStatus = (cert: Certification): CertStatus => {
  if (cert.inProgress) return "studying";
  if (!cert.expirationDate) return "permanent";
  const exp = parseDate(cert.expirationDate);
  if (!exp) return "permanent";
  const now = new Date();
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  if (exp < now) return "expired";
  if (exp < threeMonths) return "expiring";
  return "active";
};

const statusConfig: Record<CertStatus, { label: string; bg: string; border: string; color: string }> = {
  studying:  { label: "Studying",  bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24" },
  active:    { label: "Active",    bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)",  color: "#34d399" },
  expiring:  { label: "Expiring",  bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24" },
  expired:   { label: "Expired",   bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", color: "#f87171" },
  permanent: { label: "No expiry", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.2)",  color: "#22d3ee" },
};

const CertificationsPage = () => {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIssuer, setActiveIssuer] = useState<string>("all");

  useEffect(() => {
    listCertifications()
      .then(setItems)
      .catch(() => setError("Failed to load certifications."))
      .finally(() => setLoading(false));
  }, []);

  const issuers = useMemo(() => {
    const s = Array.from(new Set(items.filter((i) => !i.inProgress).map((i) => i.issuer).filter(Boolean))) as string[];
    return s.sort();
  }, [items]);

  const inProgressItems = useMemo(() => items.filter((i) => i.inProgress), [items]);

  const filtered = useMemo(() => {
    const earned = items.filter((i) => !i.inProgress);
    if (activeIssuer === "all") return earned;
    return earned.filter((i) => i.issuer === activeIssuer);
  }, [items, activeIssuer]);

  const filterPillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 20,
    color: active ? "#22d3ee" : "#9ca3af",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    padding: "5px 14px",
    transition: "all 0.15s ease",
    userSelect: "none" as const,
  });

  return (
    <main style={{ margin: "0 auto", maxWidth: 1120, padding: "48px 24px" }}>
      <Space direction="vertical" size={40} style={{ width: "100%" }}>

        <div className="fade-in">
          <Text style={{ color: "#22d3ee", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Credentials
          </Text>
          <Title
            level={1}
            style={{ color: "#f9fafb", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: 8, marginTop: 8 }}
          >
            Certifications
          </Title>
          <Text style={{ color: "#6b7280", fontSize: 16 }}>
            Professional credentials and verifiable achievements.
          </Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {/* In-progress section */}
        {!loading && inProgressItems.length > 0 && (
          <div className="fade-in-1">
            <Text style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Currently Studying
            </Text>
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 16 }}>
              {inProgressItems.map((item) => (
                <Card key={item.certificationId} className="glass-card" styles={{ body: { padding: 0 } }}
                  style={{ borderColor: "rgba(251,191,36,0.2)" }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{
                      alignItems: "center", background: "rgba(251,191,36,0.04)",
                      borderBottom: "1px solid rgba(251,191,36,0.15)", borderRadius: "12px 12px 0 0",
                      display: "flex", height: 120, justifyContent: "center", padding: 16,
                    }}>
                      {item.badgeUrl
                        ? <Image src={item.badgeUrl} alt={`${item.name} badge`} height={96} preview={false} style={{ objectFit: "contain" }} />
                        : <SafetyCertificateOutlined style={{ color: "#fbbf24", fontSize: 56 }} />
                      }
                    </div>
                    <div style={{ flex: 1, padding: "18px 20px 20px" }}>
                      <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <div>
                          <Title level={4} style={{ color: "#f9fafb", margin: "0 0 4px" }}>{item.name}</Title>
                          <Text strong style={{ color: "#22d3ee", fontSize: 13 }}>{item.issuer}</Text>
                        </div>
                        <Tag style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", borderRadius: 5, fontSize: 11 }}>
                          Studying
                        </Tag>
                        {item.verificationUrl && (
                          <Button size="small" href={item.verificationUrl} target="_blank" rel="noreferrer"
                            style={{ borderColor: "rgba(34,211,238,0.35)", color: "#22d3ee", marginTop: 4 }}>
                            More Info
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Issuer filter */}
        {!loading && issuers.length > 1 && (
          <Space wrap size={[8, 8]} className="fade-in">
            <span style={filterPillStyle(activeIssuer === "all")} onClick={() => setActiveIssuer("all")}>
              All ({items.filter((i) => !i.inProgress).length})
            </span>
            {issuers.map((iss) => (
              <span key={iss} style={filterPillStyle(activeIssuer === iss)} onClick={() => setActiveIssuer(iss)}>
                {iss} ({items.filter((i) => !i.inProgress && i.issuer === iss).length})
              </span>
            ))}
          </Space>
        )}

        {loading ? (
          <div style={{ display: "grid", minHeight: 220, placeItems: "center" }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty description={<Text style={{ color: "#6b7280" }}>No certifications found.</Text>} />
        ) : (
          <div
            className="fade-in-1"
            style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {filtered.map((item) => {
              const status = getCertStatus(item);
              const s = statusConfig[status];
              return (
                <Card key={item.certificationId} className="glass-card" styles={{ body: { padding: 0 } }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {/* Badge area */}
                    <div style={{
                      alignItems: "center",
                      background: "rgba(255,255,255,0.02)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px 12px 0 0",
                      display: "flex",
                      height: 120,
                      justifyContent: "center",
                      padding: 16,
                    }}>
                      {item.badgeUrl ? (
                        <Image
                          src={item.badgeUrl}
                          alt={`${item.name} badge`}
                          height={96}
                          preview={false}
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <SafetyCertificateOutlined style={{ color: "#22d3ee", fontSize: 56 }} />
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, padding: "18px 20px 20px" }}>
                      <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <div>
                          <Title level={4} style={{ color: "#f9fafb", margin: "0 0 4px" }}>{item.name}</Title>
                          <Text strong style={{ color: "#22d3ee", fontSize: 13 }}>{item.issuer}</Text>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <Tag style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 5, fontSize: 11 }}>
                            {s.label}
                          </Tag>
                          <Text style={{ color: "#4b5563", fontSize: 12 }}>
                            Issued {item.issueDate}
                          </Text>
                        </div>

                        {item.expirationDate && (
                          <Text style={{ color: "#4b5563", fontSize: 12 }}>
                            Expires {item.expirationDate}
                          </Text>
                        )}

                        {item.verificationUrl && (
                          <Button
                            size="small"
                            href={item.verificationUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ borderColor: "rgba(34,211,238,0.35)", color: "#22d3ee", marginTop: 4 }}
                          >
                            Verify Credential
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Space>
    </main>
  );
};

export default CertificationsPage;

import { useEffect, useMemo, useState } from "react";
import { Alert, Empty, Space, Spin, Tag, Typography } from "antd";
import { listSkills } from "../../services/skillsService";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "../../types/skill";

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

const SkillsPage = () => {
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSkills()
      .then(setItems)
      .catch(() => setError("Failed to load skills."))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return SKILL_CATEGORIES.map((category) => ({
      category,
      items: items
        .filter((item) => item.category === category)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    }));
  }, [items]);

  return (
    <main style={{ margin: "0 auto", maxWidth: 960, padding: "48px 24px" }}>
      <Space direction="vertical" size={48} style={{ width: "100%" }}>

        <div className="fade-in">
          <Typography.Title
            level={1}
            style={{ color: "#f9fafb", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: 8 }}
          >
            Skills
          </Typography.Title>
          <Typography.Text style={{ color: "#6b7280", fontSize: 16 }}>
            Technologies and practices used across portfolio work.
          </Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <div style={{ display: "grid", minHeight: 220, placeItems: "center" }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <Empty description={<Typography.Text style={{ color: "#6b7280" }}>No skills listed yet.</Typography.Text>} />
        ) : (
          <Space direction="vertical" size={36} style={{ width: "100%" }} className="fade-in-1">
            {grouped.map(({ category, items: categoryItems }) =>
              categoryItems.length > 0 && (
                <section key={category}>
                  <Typography.Title
                    level={3}
                    style={{ color: categoryAccents[category].color, marginBottom: 16 }}
                  >
                    {categoryLabels[category]}
                  </Typography.Title>
                  <Space size={[8, 10]} wrap>
                    {categoryItems.map((item) => (
                      <Tag
                        key={item.skillId}
                        style={{
                          background: categoryAccents[category].bg,
                          border: `1px solid ${categoryAccents[category].border}`,
                          color: categoryAccents[category].color,
                          borderRadius: 6,
                          fontSize: 14,
                          padding: "4px 12px",
                        }}
                      >
                        {item.name}
                      </Tag>
                    ))}
                  </Space>
                </section>
              )
            )}
          </Space>
        )}
      </Space>
    </main>
  );
};

export default SkillsPage;

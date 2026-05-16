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
    <main style={{ margin: "0 auto", maxWidth: 960, padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Skills
          </Typography.Title>
          <Typography.Text type="secondary">
            Technologies and practices used across portfolio work.
          </Typography.Text>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <div style={{ display: "grid", minHeight: 220, placeItems: "center" }}>
            <Spin />
          </div>
        ) : items.length === 0 ? (
          <Empty description="No skills listed yet." />
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {grouped.map(({ category, items: categoryItems }) => (
              categoryItems.length > 0 && (
                <section key={category}>
                  <Typography.Title level={3}>{categoryLabels[category]}</Typography.Title>
                  <Space size={[8, 8]} wrap>
                    {categoryItems.map((item) => (
                      <Tag key={item.skillId} style={{ fontSize: 14, padding: "4px 10px" }}>
                        {item.name}
                      </Tag>
                    ))}
                  </Space>
                </section>
              )
            ))}
          </Space>
        )}
      </Space>
    </main>
  );
};

export default SkillsPage;

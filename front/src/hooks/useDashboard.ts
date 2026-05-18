import { useEffect, useState } from "react";
import { listMessages } from "../services/contactService";
import { listProjectsAdmin } from "../services/projectsService";

export interface DashboardStats {
  total: number;
  published: number;
  draft: number;
  featured: number;
}

const emptyStats: DashboardStats = {
  total: 0,
  published: 0,
  draft: 0,
  featured: 0,
};

export function useDashboard(idToken: string | null) {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(idToken));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listProjectsAdmin(idToken),
      listMessages(idToken, "unread"),
    ])
      .then(([projects, unreadMessages]) => {
        if (!mounted) return;
        setStats({
          total: projects.length,
          published: projects.filter((project) => project.status === "published").length,
          draft: projects.filter((project) => project.status === "draft").length,
          featured: projects.filter((project) => project.featured).length,
        });
        setUnreadCount(unreadMessages.length);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Dashboard data is unavailable.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [idToken]);

  return { stats, unreadCount, loading, error };
}

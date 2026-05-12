// Shared labels, statuses, colors, and fixed values.
// Feature-specific constants will be added in Phase 2 feature tickets.

export const APP_NAME = "Portfolio CRM";

export const ROUTES = {
  HOME: "/",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:slug",
  EXPERIENCE: "/experience",
  SKILLS: "/skills",
  CERTIFICATIONS: "/certifications",
  ABOUT: "/about",
  CONTACT: "/contact",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_PROJECTS: "/admin/projects",
  ADMIN_EXPERIENCE: "/admin/experience",
  ADMIN_SKILLS: "/admin/skills",
  ADMIN_CERTIFICATIONS: "/admin/certifications",
  ADMIN_MEDIA: "/admin/media",
  ADMIN_MESSAGES: "/admin/messages",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

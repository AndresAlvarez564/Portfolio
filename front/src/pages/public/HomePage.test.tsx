import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";
import { getProfile } from "../../services/profileService";
import { listProjects } from "../../services/projectsService";
import { listExperience } from "../../services/experienceService";
import { listSkills } from "../../services/skillsService";
import { listCertifications } from "../../services/certificationsService";

vi.mock("../../services/profileService", () => ({ getProfile: vi.fn() }));
vi.mock("../../services/projectsService", () => ({ listProjects: vi.fn() }));
vi.mock("../../services/experienceService", () => ({ listExperience: vi.fn() }));
vi.mock("../../services/skillsService", () => ({ listSkills: vi.fn() }));
vi.mock("../../services/certificationsService", () => ({ listCertifications: vi.fn() }));

const profile = {
  name: "Andres Alvarez",
  title: "Solutions Architect",
  summary: "I build practical cloud systems.",
  location: "La Paz, Bolivia",
  aboutIntro: "I connect cloud architecture with practical delivery.",
  aboutValues: "Clear documentation\nReliable delivery",
  cvFileUrl: "https://cdn.example.com/cv.pdf",
  socialLinks: {
    github: "https://github.com/andres",
    linkedin: "https://linkedin.com/in/andres",
  },
};

const project = {
  projectId: "project-one",
  slug: "project-one",
  title: "Featured CRM",
  description: "A portfolio CRM project.",
  techStack: ["React", "AWS"],
  category: "SaaS",
  status: "published" as const,
  featured: true,
  featuredOrder: 1,
  thumbnailUrl: "https://cdn.example.com/project.png",
  createdAt: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-01T00:00:00Z",
};

const renderHome = () => render(
  <MemoryRouter>
    <HomePage />
  </MemoryRouter>,
);

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(getProfile).mockResolvedValue(profile);
    vi.mocked(listProjects).mockResolvedValue([project]);
    vi.mocked(listExperience).mockResolvedValue([
      {
        experienceId: "exp-one",
        company: "Acme",
        title: "Cloud Engineer",
        description: "Built systems.",
        startDate: "2024-01",
        endDate: "",
        current: true,
        order: 1,
      },
    ]);
    vi.mocked(listSkills).mockResolvedValue([
      {
        skillId: "skill-one",
        name: "Python",
        category: "backend",
        visibility: "visible",
        order: 1,
      },
    ]);
    vi.mocked(listCertifications).mockResolvedValue([
      {
        certificationId: "cert-one",
        name: "AWS Developer",
        issuer: "AWS",
        issueDate: "2026-01",
        badgeUrl: "https://cdn.example.com/badge.png",
      },
    ]);
  });

  it("renders hero with profile data", async () => {
    renderHome();

    expect(await screen.findByText("Andres Alvarez")).toBeInTheDocument();
    expect(screen.getByText("Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("I build practical cloud systems.")).toBeInTheDocument();
    expect(screen.getByText("La Paz, Bolivia")).toBeInTheDocument();
  });

  it("renders featured projects", async () => {
    renderHome();

    expect(await screen.findByText("Featured CRM")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders about preview from profile data", async () => {
    renderHome();

    expect(await screen.findByText("About Me")).toBeInTheDocument();
    expect(screen.getByText("I connect cloud architecture with practical delivery.")).toBeInTheDocument();
    expect(screen.getByText("Clear documentation")).toBeInTheDocument();
    expect(screen.getByText("Read More")).toBeInTheDocument();
  });

  it("hides cv button when no cv url", async () => {
    vi.mocked(getProfile).mockResolvedValue({ ...profile, cvFileUrl: "" });

    renderHome();

    await screen.findByText("Andres Alvarez");
    expect(screen.queryByText("Download CV")).not.toBeInTheDocument();
  });

  it("hides featured section when empty", async () => {
    vi.mocked(listProjects).mockResolvedValue([{ ...project, featured: false }]);

    renderHome();

    await screen.findByText("Andres Alvarez");
    await waitFor(() => expect(screen.queryByText("Featured Projects")).not.toBeInTheDocument());
  });

  it("renders fallback when api fails", async () => {
    vi.mocked(listSkills).mockRejectedValue(new Error("boom"));

    renderHome();

    expect(await screen.findByText("Andres Alvarez")).toBeInTheDocument();
    expect(await screen.findByText("Skills are unavailable.")).toBeInTheDocument();
  });
});

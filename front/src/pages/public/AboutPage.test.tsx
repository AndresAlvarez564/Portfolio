import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AboutPage from "./AboutPage";
import { getProfile } from "../../services/profileService";

vi.mock("../../services/profileService", () => ({ getProfile: vi.fn() }));

const profile = {
  name: "Andres Alvarez",
  title: "Junior Solutions Architect",
  summary: "I build practical cloud systems with AWS.",
  location: "La Paz, Bolivia",
  aboutIntro: "Editable story from admin.",
  aboutFocus: "Editable AWS focus from admin.",
  aboutBuilds: "Editable project systems.\nEditable admin tools.",
  aboutValues: "Editable clarity\nEditable reliability",
  cvFileUrl: "https://cdn.example.com/cv.pdf",
  socialLinks: {
    github: "https://github.com/andres",
    linkedin: "https://linkedin.com/in/andres",
  },
};

const renderAbout = () => render(
  <MemoryRouter>
    <AboutPage />
  </MemoryRouter>,
);

describe("AboutPage", () => {
  beforeEach(() => {
    vi.mocked(getProfile).mockResolvedValue(profile);
  });

  it("renders profile-driven hero content", async () => {
    renderAbout();

    expect(await screen.findByText("Andres Alvarez")).toBeInTheDocument();
    expect(screen.getByText("Junior Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("I build practical cloud systems with AWS.")).toBeInTheDocument();
    expect(screen.getByText("La Paz, Bolivia")).toBeInTheDocument();
  });

  it("renders cloud and Solutions Architect sections", async () => {
    renderAbout();

    expect(await screen.findByText("Cloud direction")).toBeInTheDocument();
    expect(screen.getByText("Cloud And AWS Focus")).toBeInTheDocument();
    expect(screen.getByText("AWS serverless")).toBeInTheDocument();
    expect(screen.getByText("What I Build")).toBeInTheDocument();
    expect(screen.getByText("Editable story from admin.")).toBeInTheDocument();
    expect(screen.getAllByText("Editable AWS focus from admin.").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Editable project systems.")).toBeInTheDocument();
    expect(screen.getByText("Editable clarity")).toBeInTheDocument();
  });

  it("hides cv button when no cv url", async () => {
    vi.mocked(getProfile).mockResolvedValue({ ...profile, cvFileUrl: "" });

    renderAbout();

    await screen.findByText("Andres Alvarez");
    expect(screen.queryByText("Download CV")).not.toBeInTheDocument();
  });

  it("renders error state when profile fails", async () => {
    vi.mocked(getProfile).mockRejectedValue(new Error("boom"));

    renderAbout();

    expect(await screen.findByText("About profile is unavailable.")).toBeInTheDocument();
  });
});

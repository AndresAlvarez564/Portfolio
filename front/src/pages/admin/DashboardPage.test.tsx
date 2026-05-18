import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage";
import { listMessages } from "../../services/contactService";
import { listProjectsAdmin } from "../../services/projectsService";

vi.mock("../../components/AdminLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("../../context/AuthContext", () => ({
  useAuthContext: () => ({ idToken: "token" }),
}));
vi.mock("../../services/contactService", () => ({ listMessages: vi.fn() }));
vi.mock("../../services/projectsService", () => ({ listProjectsAdmin: vi.fn() }));

const projects = [
  { projectId: "one", status: "published", featured: true },
  { projectId: "two", status: "draft", featured: false },
  { projectId: "three", status: "published", featured: false },
];

const renderDashboard = () => render(
  <MemoryRouter>
    <DashboardPage />
  </MemoryRouter>,
);

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.mocked(listProjectsAdmin).mockResolvedValue(projects as never);
    vi.mocked(listMessages).mockResolvedValue([{ messageId: "message-one" }] as never);
  });

  it("renders stat cards with data", async () => {
    renderDashboard();

    expect(await screen.findByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Unread Messages")).toBeInTheDocument();
  });

  it("renders loading skeleton", () => {
    vi.mocked(listProjectsAdmin).mockReturnValue(new Promise(() => {}) as never);
    vi.mocked(listMessages).mockReturnValue(new Promise(() => {}) as never);

    const { container } = renderDashboard();

    expect(container.querySelector(".ant-skeleton")).toBeInTheDocument();
  });

  it("renders error state", async () => {
    vi.mocked(listProjectsAdmin).mockRejectedValue(new Error("boom"));

    renderDashboard();

    expect(await screen.findByText("Dashboard data is unavailable.")).toBeInTheDocument();
  });
});

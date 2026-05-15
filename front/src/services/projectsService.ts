import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Project, ProjectInput, ProjectPatch } from "../types/project";
import type { CaseStudy, CaseStudyInput } from "../types/caseStudy";

export async function listProjects(): Promise<Project[]> {
  return apiGet<Project[]>("/projects");
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  return apiGet<Project>(`/projects/${slug}`);
}

export async function listProjectsAdmin(token: string): Promise<Project[]> {
  return apiGet<Project[]>("/projects/admin", token);
}

export async function getProjectAdmin(id: string, token: string): Promise<Project> {
  return apiGet<Project>(`/projects/${id}/admin`, token);
}

export async function createProject(data: ProjectInput, token: string): Promise<Project> {
  return apiPost<Project>("/projects", data, token);
}

export async function updateProject(id: string, data: ProjectInput, token: string): Promise<Project> {
  return apiPut<Project>(`/projects/${id}`, data, token);
}

export async function deleteProject(id: string, token: string): Promise<void> {
  return apiDelete(`/projects/${id}`, token);
}

export async function patchProject(id: string, data: ProjectPatch, token: string): Promise<Project> {
  return apiPatch<Project>(`/projects/${id}`, data, token);
}

export async function getCaseStudy(projectId: string): Promise<CaseStudy | null> {
  const data = await apiGet<CaseStudy | Record<string, never>>(`/projects/${projectId}/case-study`);
  return Object.keys(data).length > 0 ? data as CaseStudy : null;
}

export async function upsertCaseStudy(
  projectId: string,
  data: CaseStudyInput,
  token: string,
): Promise<CaseStudy> {
  return apiPut<CaseStudy>(`/projects/${projectId}/case-study`, data, token);
}

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Experience, ExperienceInput } from "../types/experience";

export async function listExperience(): Promise<Experience[]> {
  return apiGet<Experience[]>("/experience");
}

export async function createExperience(data: ExperienceInput, token: string): Promise<Experience> {
  return apiPost<Experience>("/experience", data, token);
}

export async function updateExperience(
  id: string,
  data: ExperienceInput,
  token: string,
): Promise<Experience> {
  return apiPut<Experience>(`/experience/${id}`, data, token);
}

export async function deleteExperience(id: string, token: string): Promise<void> {
  return apiDelete(`/experience/${id}`, token);
}

export async function reorderExperience(orderedIds: string[], token: string): Promise<Experience[]> {
  return apiPatch<Experience[]>("/experience/reorder", { orderedIds }, token);
}

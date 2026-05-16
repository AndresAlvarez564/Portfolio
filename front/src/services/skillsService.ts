import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import type { Skill, SkillInput } from "../types/skill";

export async function listSkills(): Promise<Skill[]> {
  return apiGet<Skill[]>("/skills");
}

export async function listSkillsAdmin(token: string): Promise<Skill[]> {
  return apiGet<Skill[]>("/skills/admin", token);
}

export async function createSkill(data: SkillInput, token: string): Promise<Skill> {
  return apiPost<Skill>("/skills", data, token);
}

export async function updateSkill(id: string, data: SkillInput, token: string): Promise<Skill> {
  return apiPut<Skill>(`/skills/${id}`, data, token);
}

export async function deleteSkill(id: string, token: string): Promise<void> {
  return apiDelete(`/skills/${id}`, token);
}

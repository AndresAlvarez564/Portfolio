export const SKILL_CATEGORIES = ["cloud", "backend", "frontend", "devops", "databases", "ai"] as const;
export const SKILL_VISIBILITIES = ["visible", "hidden"] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];
export type SkillVisibility = typeof SKILL_VISIBILITIES[number];

export interface Skill {
  skillId: string;
  name: string;
  category: SkillCategory;
  visibility: SkillVisibility;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type SkillInput = {
  name: string;
  category: SkillCategory;
  visibility: SkillVisibility;
  order: number;
};

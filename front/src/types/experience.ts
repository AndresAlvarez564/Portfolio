export interface Experience {
  experienceId: string;
  company: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ExperienceInput = {
  company: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
};

export interface CaseStudy {
  entityType?: "CASE_STUDY";
  projectId: string;
  problem: string;
  solution: string;
  architecture: string;
  challenges?: string;
  results?: string;
  updatedAt?: string;
}

export type CaseStudyInput = {
  problem: string;
  solution: string;
  architecture: string;
  challenges?: string;
  results?: string;
};

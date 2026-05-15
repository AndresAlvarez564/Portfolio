export type ProjectStatus = "draft" | "published";

export interface Project {
  projectId: string;
  slug: string;
  title: string;
  description: string;
  techStack: string[];
  category: string;
  status: ProjectStatus;
  featured: boolean;
  featuredOrder: number;
  thumbnailUrl?: string;
  thumbnailS3Key?: string;
  screenshotKeys?: string[];
  screenshotUrls?: string[];
  githubUrl?: string;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectInput = {
  title: string;
  description: string;
  techStack: string[];
  category?: string;
  status: ProjectStatus;
  featured: boolean;
  featuredOrder?: number;
  thumbnailUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
};

export type ProjectPatch = {
  status?: ProjectStatus;
  featured?: boolean;
  featuredOrder?: number;
};

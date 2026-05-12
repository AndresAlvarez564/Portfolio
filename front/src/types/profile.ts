export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface ProfileData {
  pk?: string;
  sk?: string;
  entityType?: string;
  name: string;
  title: string;
  summary: string;
  location: string;
  cvFileUrl?: string;
  socialLinks: SocialLinks;
  updatedAt?: string;
}

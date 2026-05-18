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
  aboutIntro?: string;
  aboutFocus?: string;
  aboutBuilds?: string;
  aboutValues?: string;
  avatarUrl?: string;
  contactEmail?: string;
  whatsapp?: string;
  contactNote?: string;
  cvFileUrl?: string;
  socialLinks: SocialLinks;
  updatedAt?: string;
}

export interface Certification {
  certificationId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  verificationUrl?: string;
  badgeUrl?: string;
  badgeS3Key?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CertificationInput = {
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  verificationUrl?: string;
  badgeUrl?: string;
  badgeS3Key?: string;
};

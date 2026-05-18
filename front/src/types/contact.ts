export const CONTACT_STATUSES = ["unread", "read", "archived"] as const;

export type ContactStatus = typeof CONTACT_STATUSES[number];

export interface ContactMessage {
  messageId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt?: string;
}

export type ContactFormData = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  subject: string;
  message: string;
  website?: string;
};

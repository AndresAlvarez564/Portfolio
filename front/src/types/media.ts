export const MEDIA_CONTEXTS = [
  "project-screenshot",
  "project-thumbnail",
  "certification-badge",
  "profile-avatar",
  "cv",
  "diagram",
] as const;

export type MediaUploadContext = typeof MEDIA_CONTEXTS[number];

export interface RequestUploadInput {
  filename: string;
  contentType: string;
  context: MediaUploadContext;
}

export interface RequestUploadResponse {
  uploadUrl: string;
  s3Key: string;
}

export interface ConfirmUploadInput {
  s3Key: string;
  mediaType: string;
  context: MediaUploadContext;
  relatedId?: string;
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface MediaRecord {
  mediaId: string;
  s3Key: string;
  cloudfrontUrl: string;
  mediaType: string;
  context: MediaUploadContext;
  relatedId?: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt: string;
  updatedAt?: string;
}

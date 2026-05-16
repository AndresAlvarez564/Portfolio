import { apiPost } from "./api";

interface UploadRequest {
  filename: string;
  contentType: string;
  context: string;
}

interface UploadResponse {
  uploadUrl: string;
  s3Key: string;
}

interface ConfirmUploadRequest {
  s3Key: string;
  mediaType: string;
  relatedId?: string;
}

interface MediaRecord {
  mediaId?: string;
  cloudfrontUrl?: string;
  url?: string;
  s3Key: string;
}

export async function uploadMediaFile(file: File, token: string): Promise<MediaRecord> {
  const upload = await apiPost<UploadResponse>("/media/upload", {
    filename: file.name,
    contentType: file.type,
    context: "certification-badge",
  } satisfies UploadRequest, token);

  const res = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error("Badge upload failed.");
  }

  return apiPost<MediaRecord>("/media/confirm", {
    s3Key: upload.s3Key,
    mediaType: "certification-badge",
  } satisfies ConfirmUploadRequest, token);
}

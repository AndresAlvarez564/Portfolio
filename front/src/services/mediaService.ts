import { apiDelete, apiGet, apiPost } from "./api";
import type {
  ConfirmUploadInput,
  MediaRecord,
  MediaUploadContext,
  RequestUploadInput,
  RequestUploadResponse,
} from "../types/media";

export async function requestUploadUrl(
  data: RequestUploadInput,
  token: string,
): Promise<RequestUploadResponse> {
  return apiPost<RequestUploadResponse>("/media/upload", data, token);
}

export async function confirmUpload(data: ConfirmUploadInput, token: string): Promise<MediaRecord> {
  return apiPost<MediaRecord>("/media/confirm", data, token);
}

export async function listMedia(token: string): Promise<MediaRecord[]> {
  return apiGet<MediaRecord[]>("/media", token);
}

export async function deleteMedia(id: string, token: string): Promise<void> {
  return apiDelete(`/media/${id}`, token);
}

export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error("Upload failed.");
  }
}

export async function uploadMediaFile(
  file: File,
  token: string,
  context: MediaUploadContext,
  mediaType: string = context,
  relatedId?: string,
): Promise<MediaRecord> {
  const upload = await requestUploadUrl({
    filename: file.name,
    contentType: file.type,
    context,
  }, token);

  await uploadFileToS3(upload.uploadUrl, file);

  return confirmUpload({
    s3Key: upload.s3Key,
    mediaType,
    context,
    relatedId,
    filename: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  }, token);
}

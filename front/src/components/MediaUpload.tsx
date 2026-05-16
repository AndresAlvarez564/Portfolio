import { useRef, useState } from "react";
import { Alert, Button, Image, Progress, Space, Typography } from "antd";
import { FilePdfOutlined, UploadOutlined } from "@ant-design/icons";
import { useAuthContext } from "../context/AuthContext";
import { uploadMediaFile } from "../services/mediaService";
import type { MediaRecord, MediaUploadContext } from "../types/media";

interface MediaUploadProps {
  context: MediaUploadContext;
  mediaType: string;
  relatedId?: string;
  onUploadComplete: (media: MediaRecord) => void;
  accept?: string;
  label?: string;
  currentUrl?: string;
  maxSizeMb?: number;
}

const MediaUpload = ({
  context,
  mediaType,
  relatedId,
  onUploadComplete,
  accept = "image/*,application/pdf",
  label = "Upload",
  currentUrl,
  maxSizeMb = 10,
}: MediaUploadProps) => {
  const { idToken } = useAuthContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!idToken) {
      setError("Sign in again before uploading.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be ${maxSizeMb} MB or smaller.`);
      return;
    }

    setUploading(true);
    setProgress(20);
    setError(null);
    try {
      const media = await uploadMediaFile(file, idToken, context, mediaType, relatedId);
      setProgress(100);
      onUploadComplete(media);
    } catch {
      setError("Upload failed. Please try again.");
      setProgress(0);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isPdf = currentUrl?.toLowerCase().endsWith(".pdf");

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {currentUrl && (
        <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
          {isPdf ? (
            <FilePdfOutlined style={{ color: "#cf1322", fontSize: 40 }} />
          ) : (
            <Image src={currentUrl} alt="Current media" width={96} height={96} style={{ objectFit: "contain" }} />
          )}
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 360 }}>
            {currentUrl}
          </Typography.Text>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <Button icon={<UploadOutlined />} loading={uploading} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
      {uploading && <Progress percent={progress} size="small" />}
      {error && <Alert type="warning" message={error} showIcon />}
    </Space>
  );
};

export default MediaUpload;

import { useEffect, useState } from "react";
import { App, Button, Card, Empty, Image, Popconfirm, Select, Space, Typography } from "antd";
import { CopyOutlined, DeleteOutlined, FilePdfOutlined } from "@ant-design/icons";
import AdminLayout from "../../components/AdminLayout";
import { useAuthContext } from "../../context/AuthContext";
import { deleteMedia, listMedia } from "../../services/mediaService";
import { MEDIA_CONTEXTS, type MediaRecord, type MediaUploadContext } from "../../types/media";

const MediaLibraryPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const [items, setItems] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MediaUploadContext | "all">("all");

  const loadItems = async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      setItems(await listMedia(idToken));
    } catch {
      message.error("Failed to load media.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [idToken]);

  const removeItem = async (item: MediaRecord) => {
    if (!idToken) return;
    try {
      await deleteMedia(item.mediaId, idToken);
      setItems((current) => current.filter((entry) => entry.mediaId !== item.mediaId));
      message.success("Media deleted.");
    } catch {
      message.error("Failed to delete media.");
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    message.success("URL copied.");
  };

  const visibleItems = filter === "all" ? items : items.filter((item) => item.context === filter);

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>
              Media
            </Typography.Title>
            <Typography.Text type="secondary">
              Browse uploaded images, PDFs, and generated public URLs.
            </Typography.Text>
          </div>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 220 }}
            options={[
              { value: "all", label: "All media" },
              ...MEDIA_CONTEXTS.map((value) => ({ value, label: value })),
            ]}
          />
        </Space>

        {visibleItems.length === 0 && !loading ? (
          <Empty description="No media found." />
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", opacity: loading ? 0.6 : 1 }}>
            {visibleItems.map((item) => {
              const isPdf = item.contentType === "application/pdf" || item.cloudfrontUrl.toLowerCase().endsWith(".pdf");
              return (
                <Card key={item.mediaId}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{ alignItems: "center", display: "flex", height: 120, justifyContent: "center" }}>
                      {isPdf ? (
                        <FilePdfOutlined style={{ color: "#cf1322", fontSize: 48 }} />
                      ) : (
                        <Image src={item.cloudfrontUrl} alt={item.filename} height={120} preview={false} style={{ objectFit: "contain" }} />
                      )}
                    </div>
                    <div>
                      <Typography.Text strong ellipsis style={{ display: "block" }}>
                        {item.filename}
                      </Typography.Text>
                      <Typography.Text type="secondary">{item.context}</Typography.Text>
                    </div>
                    <Space>
                      <Button icon={<CopyOutlined />} onClick={() => copyUrl(item.cloudfrontUrl)} />
                      <Popconfirm
                        title="Delete media?"
                        description="This removes the S3 object and media record."
                        onConfirm={() => removeItem(item)}
                      >
                        <Button danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </Space>
                </Card>
              );
            })}
          </div>
        )}
      </Space>
    </AdminLayout>
  );
};

export default MediaLibraryPage;

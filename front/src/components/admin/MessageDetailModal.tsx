import { Button, Descriptions, Modal, Space, Tag, Typography } from "antd";
import type { ContactMessage, ContactStatus } from "../../types/contact";

interface MessageDetailModalProps {
  message: ContactMessage | null;
  open: boolean;
  updating: boolean;
  onClose: () => void;
  onStatusChange: (status: ContactStatus) => Promise<void>;
}

const statusColor: Record<ContactStatus, string> = {
  unread: "blue",
  read: "green",
  archived: "default",
};

const MessageDetailModal = ({
  message,
  open,
  updating,
  onClose,
  onStatusChange,
}: MessageDetailModalProps) => {
  return (
    <Modal
      title={message?.subject ?? "Message"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
    >
      {message && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Status">
              <Tag color={statusColor[message.status]}>{message.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Name">{message.name}</Descriptions.Item>
            <Descriptions.Item label="Email">
              <a href={`mailto:${message.email}`}>{message.email}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {message.phone ? <a href={`tel:${message.phone}`}>{message.phone}</a> : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Company">{message.company || "-"}</Descriptions.Item>
            <Descriptions.Item label="Project Type">{message.projectType || "-"}</Descriptions.Item>
            <Descriptions.Item label="Budget">{message.budget || "-"}</Descriptions.Item>
            <Descriptions.Item label="Date">{message.createdAt}</Descriptions.Item>
          </Descriptions>

          <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {message.message}
          </Typography.Paragraph>

          <Space wrap>
            {message.status !== "read" && (
              <Button loading={updating} onClick={() => onStatusChange("read")}>
                Mark as Read
              </Button>
            )}
            {message.status !== "archived" && (
              <Button loading={updating} onClick={() => onStatusChange("archived")}>
                Archive
              </Button>
            )}
            {message.status !== "unread" && (
              <Button loading={updating} onClick={() => onStatusChange("unread")}>
                Mark as Unread
              </Button>
            )}
          </Space>
        </Space>
      )}
    </Modal>
  );
};

export default MessageDetailModal;

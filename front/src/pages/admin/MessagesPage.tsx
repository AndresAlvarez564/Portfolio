import { useEffect, useMemo, useState } from "react";
import { App, Badge, Button, Card, Empty, Space, Table, Tabs, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import AdminLayout from "../../components/AdminLayout";
import MessageDetailModal from "../../components/admin/MessageDetailModal";
import { useAuthContext } from "../../context/AuthContext";
import {
  getMessage,
  listMessages,
  updateMessageStatus,
} from "../../services/contactService";
import type { ContactMessage, ContactStatus } from "../../types/contact";

type TabKey = "all" | ContactStatus;

const statusColor: Record<ContactStatus, string> = {
  unread: "blue",
  read: "green",
  archived: "default",
};

const MessagesPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadItems = async (status: TabKey = activeTab) => {
    if (!idToken) return;
    setLoading(true);
    try {
      setItems(await listMessages(idToken, status === "all" ? undefined : status));
    } catch {
      message.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems(activeTab);
  }, [idToken, activeTab]);

  const unreadCount = useMemo(
    () => items.filter((item) => item.status === "unread").length,
    [items],
  );

  const openMessage = async (item: ContactMessage) => {
    if (!idToken) return;
    try {
      const fullMessage = await getMessage(item.messageId, idToken);
      setSelected(fullMessage);
      setModalOpen(true);
    } catch {
      message.error("Failed to open message.");
    }
  };

  const changeStatus = async (status: ContactStatus) => {
    if (!idToken || !selected) return;
    setUpdating(true);
    try {
      const updated = await updateMessageStatus(selected.messageId, status, idToken);
      setSelected(updated);
      setItems((current) => current.map((item) => item.messageId === updated.messageId ? updated : item));
      message.success("Message updated.");
    } catch {
      message.error("Failed to update message.");
    } finally {
      setUpdating(false);
    }
  };

  const columns: ColumnsType<ContactMessage> = [
    {
      title: "Sender",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Subject",
      dataIndex: "subject",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value: ContactStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, item) => (
        <Button icon={<EyeOutlined />} onClick={() => openMessage(item)} />
      ),
    },
  ];

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            Messages
          </Typography.Title>
          <Typography.Text type="secondary">
            Review contact form submissions and update their status.
          </Typography.Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={[
            { key: "all", label: "All" },
            { key: "unread", label: <Badge count={unreadCount} size="small">Unread</Badge> },
            { key: "read", label: "Read" },
            { key: "archived", label: "Archived" },
          ]}
        />

        {items.length === 0 && !loading ? (
          <Empty description="No messages found." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="admin-table-desktop">
              <Table
                rowKey="messageId"
                columns={columns}
                dataSource={items}
                loading={loading}
                pagination={false}
                onRow={(item) => ({ onDoubleClick: () => openMessage(item) })}
              />
            </div>

            {/* Mobile cards */}
            <div className="admin-cards-mobile">
              {items.map((item) => (
                <Card
                  key={item.messageId}
                  size="small"
                  style={{ cursor: "pointer" }}
                  onClick={() => openMessage(item)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <Typography.Text strong ellipsis style={{ display: "block" }}>{item.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.email}</Typography.Text>
                    </div>
                    <Tag color={statusColor[item.status]}>{item.status}</Tag>
                  </div>
                  <Typography.Text style={{ fontSize: 13, display: "block", marginBottom: 4 }}>{item.subject}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.createdAt}</Typography.Text>
                </Card>
              ))}
            </div>
          </>
        )}
      </Space>

      <MessageDetailModal
        message={selected}
        open={modalOpen}
        updating={updating}
        onClose={() => setModalOpen(false)}
        onStatusChange={changeStatus}
      />
    </AdminLayout>
  );
};

export default MessagesPage;

import { useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Modal,
  Popconfirm,
  Space,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import AdminLayout from "../../components/AdminLayout";
import ExperienceForm from "../../components/admin/ExperienceForm";
import { useAuthContext } from "../../context/AuthContext";
import {
  createExperience,
  deleteExperience,
  listExperience,
  reorderExperience,
  updateExperience,
} from "../../services/experienceService";
import type { Experience, ExperienceInput } from "../../types/experience";

const AdminExperiencePage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      setItems(await listExperience());
    } catch {
      message.error("Failed to load experience.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: Experience) => {
    setEditing(item);
    setModalOpen(true);
  };

  const saveItem = async (value: ExperienceInput) => {
    if (!idToken) return;

    if (editing) {
      const updated = await updateExperience(editing.experienceId, value, idToken);
      setItems((current) =>
        current.map((item) => item.experienceId === updated.experienceId ? updated : item),
      );
      message.success("Experience updated.");
    } else {
      const created = await createExperience(value, idToken);
      setItems((current) => [...current, created]);
      message.success("Experience added.");
    }

    setModalOpen(false);
  };

  const removeItem = async (item: Experience) => {
    if (!idToken) return;
    try {
      await deleteExperience(item.experienceId, idToken);
      setItems((current) => current.filter((entry) => entry.experienceId !== item.experienceId));
      message.success("Experience deleted.");
    } catch {
      message.error("Failed to delete experience.");
    }
  };

  const persistOrder = async (nextItems: Experience[]) => {
    if (!idToken) return;
    setItems(nextItems);
    try {
      const updated = await reorderExperience(nextItems.map((item) => item.experienceId), idToken);
      setItems(updated);
      message.success("Experience reordered.");
    } catch {
      message.error("Failed to reorder experience.");
      void loadItems();
    }
  };

  const moveDraggedItem = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const current = [...items];
    const from = current.findIndex((item) => item.experienceId === draggedId);
    const to = current.findIndex((item) => item.experienceId === targetId);
    if (from < 0 || to < 0) return;

    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setDraggedId(null);
    await persistOrder(current);
  };

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>
              Experience
            </Typography.Title>
            <Typography.Text type="secondary">
              Manage roles and drag rows to update display order.
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Role
          </Button>
        </Space>

        {items.length === 0 && !loading ? (
          <Empty description="No experience entries yet." />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: "100%", opacity: loading ? 0.6 : 1 }}>
            {items.map((item) => (
              <Card
                key={item.experienceId}
                draggable
                onDragStart={() => setDraggedId(item.experienceId)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveDraggedItem(item.experienceId)}
              >
                <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
                  <Space align="start">
                    <DragOutlined style={{ color: "#8c8c8c", cursor: "grab", fontSize: 18, marginTop: 4 }} />
                    <div>
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <br />
                      <Typography.Text>{item.company}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary">
                        {item.startDate} - {item.current ? "Present" : item.endDate}
                      </Typography.Text>
                    </div>
                  </Space>
                  <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(item)} />
                    <Popconfirm
                      title="Delete experience?"
                      description="This action cannot be undone."
                      onConfirm={() => removeItem(item)}
                    >
                      <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Space>

      <Modal
        title={editing ? "Edit Experience" : "Add Role"}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <ExperienceForm
          initialValue={editing}
          onCancel={() => setModalOpen(false)}
          onSubmit={saveItem}
        />
      </Modal>
    </AdminLayout>
  );
};

export default AdminExperiencePage;

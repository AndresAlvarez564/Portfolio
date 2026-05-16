import { useEffect, useState } from "react";
import { App, Button, Empty, Modal, Popconfirm, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../../components/AdminLayout";
import SkillForm from "../../components/admin/SkillForm";
import { useAuthContext } from "../../context/AuthContext";
import {
  createSkill,
  deleteSkill,
  listSkillsAdmin,
  updateSkill,
} from "../../services/skillsService";
import type { Skill, SkillInput } from "../../types/skill";

const AdminSkillsPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadItems = async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      setItems(await listSkillsAdmin(idToken));
    } catch {
      message.error("Failed to load skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [idToken]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: Skill) => {
    setEditing(item);
    setModalOpen(true);
  };

  const saveItem = async (value: SkillInput) => {
    if (!idToken) return;

    if (editing) {
      const updated = await updateSkill(editing.skillId, value, idToken);
      setItems((current) => current.map((item) => item.skillId === updated.skillId ? updated : item));
      message.success("Skill updated.");
    } else {
      const created = await createSkill(value, idToken);
      setItems((current) => [...current, created]);
      message.success("Skill added.");
    }

    setModalOpen(false);
  };

  const removeItem = async (item: Skill) => {
    if (!idToken) return;
    try {
      await deleteSkill(item.skillId, idToken);
      setItems((current) => current.filter((entry) => entry.skillId !== item.skillId));
      message.success("Skill deleted.");
    } catch {
      message.error("Failed to delete skill.");
    }
  };

  const columns: ColumnsType<Skill> = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Visibility",
      dataIndex: "visibility",
      render: (value: Skill["visibility"]) => (
        <Tag color={value === "visible" ? "green" : "default"}>{value}</Tag>
      ),
      filters: [
        { text: "Visible", value: "visible" },
        { text: "Hidden", value: "hidden" },
      ],
      onFilter: (value, record) => record.visibility === value,
    },
    {
      title: "Order",
      dataIndex: "order",
      width: 100,
      sorter: (a, b) => a.order - b.order,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, item) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(item)} />
          <Popconfirm
            title="Delete skill?"
            description="This action cannot be undone."
            onConfirm={() => removeItem(item)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>
              Skills
            </Typography.Title>
            <Typography.Text type="secondary">
              Manage grouped public skill tags and hidden drafts.
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Skill
          </Button>
        </Space>

        {items.length === 0 && !loading ? (
          <Empty description="No skills yet." />
        ) : (
          <Table
            rowKey="skillId"
            columns={columns}
            dataSource={items}
            loading={loading}
            pagination={false}
          />
        )}
      </Space>

      <Modal
        title={editing ? "Edit Skill" : "Add Skill"}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <SkillForm
          initialValue={editing}
          onCancel={() => setModalOpen(false)}
          onSubmit={saveItem}
        />
      </Modal>
    </AdminLayout>
  );
};

export default AdminSkillsPage;

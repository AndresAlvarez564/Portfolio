import { useEffect, useState } from "react";
import { App, Button, Empty, Modal, Popconfirm, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import AdminLayout from "../../components/AdminLayout";
import CertificationForm from "../../components/admin/CertificationForm";
import { useAuthContext } from "../../context/AuthContext";
import {
  createCertification,
  deleteCertification,
  listCertifications,
  updateCertification,
} from "../../services/certificationsService";
import type { Certification, CertificationInput } from "../../types/certification";

const AdminCertificationsPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      setItems(await listCertifications());
    } catch {
      message.error("Failed to load certifications.");
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

  const openEdit = (item: Certification) => {
    setEditing(item);
    setModalOpen(true);
  };

  const saveItem = async (value: CertificationInput) => {
    if (!idToken) return;

    if (editing) {
      const updated = await updateCertification(editing.certificationId, value, idToken);
      setItems((current) => current.map((item) => item.certificationId === updated.certificationId ? updated : item));
      message.success("Certification updated.");
    } else {
      const created = await createCertification(value, idToken);
      setItems((current) => [created, ...current]);
      message.success("Certification added.");
    }

    setModalOpen(false);
  };

  const removeItem = async (item: Certification) => {
    if (!idToken) return;
    try {
      await deleteCertification(item.certificationId, idToken);
      setItems((current) => current.filter((entry) => entry.certificationId !== item.certificationId));
      message.success("Certification deleted.");
    } catch {
      message.error("Failed to delete certification.");
    }
  };

  const columns: ColumnsType<Certification> = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Issuer",
      dataIndex: "issuer",
      sorter: (a, b) => a.issuer.localeCompare(b.issuer),
    },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      sorter: (a, b) => a.issueDate.localeCompare(b.issueDate),
      defaultSortOrder: "descend",
    },
    {
      title: "Expiration",
      dataIndex: "expirationDate",
      render: (value?: string) => value || "No expiration",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, item) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(item)} />
          <Popconfirm
            title="Delete certification?"
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
              Certifications
            </Typography.Title>
            <Typography.Text type="secondary">
              Manage credentials, verification links, and badge images.
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Certification
          </Button>
        </Space>

        {items.length === 0 && !loading ? (
          <Empty description="No certifications yet." />
        ) : (
          <Table
            rowKey="certificationId"
            columns={columns}
            dataSource={items}
            loading={loading}
            pagination={false}
          />
        )}
      </Space>

      <Modal
        title={editing ? "Edit Certification" : "Add Certification"}
        open={modalOpen}
        footer={null}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <CertificationForm
          idToken={idToken}
          initialValue={editing}
          onCancel={() => setModalOpen(false)}
          onSubmit={saveItem}
        />
      </Modal>
    </AdminLayout>
  );
};

export default AdminCertificationsPage;

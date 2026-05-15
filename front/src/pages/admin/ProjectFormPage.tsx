import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Card, Checkbox, Form, Input, InputNumber, Select, Space, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AdminLayout from "../../components/AdminLayout";
import { useAuthContext } from "../../context/AuthContext";
import {
  createProject,
  getProjectAdmin,
  updateProject,
} from "../../services/projectsService";
import { ROUTES } from "../../constants";
import type { ProjectInput } from "../../types/project";

const optionalUrl = yup
  .string()
  .test("url-or-empty", "Must be a valid URL.", (value) => {
    if (!value) return true;
    return yup.string().url().isValidSync(value);
  })
  .default("");

const schema = yup.object({
  title: yup.string().required("Title is required.").max(160),
  description: yup.string().required("Description is required.").max(1200),
  techStack: yup.array(yup.string().required()).default([]),
  category: yup.string().default(""),
  status: yup.mixed<"draft" | "published">().oneOf(["draft", "published"]).required(),
  featured: yup.boolean().required().default(false),
  featuredOrder: yup.number().min(0).optional().default(0),
  thumbnailUrl: optionalUrl,
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  title: "",
  description: "",
  techStack: [],
  category: "",
  status: "draft",
  featured: false,
  featuredOrder: 0,
  thumbnailUrl: "",
  githubUrl: "",
  liveUrl: "",
};

const ProjectFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (!idToken || !id) return;

    getProjectAdmin(id, idToken)
      .then((project) => reset({
        title: project.title,
        description: project.description,
        techStack: project.techStack ?? [],
        category: project.category ?? "",
        status: project.status,
        featured: project.featured,
        featuredOrder: project.featuredOrder ?? 0,
        thumbnailUrl: project.thumbnailUrl ?? "",
        githubUrl: project.githubUrl ?? "",
        liveUrl: project.liveUrl ?? "",
      }))
      .catch(() => message.error("Failed to load project."));
  }, [id, idToken, message, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!idToken) return;

    const payload: ProjectInput = {
      title: values.title,
      description: values.description,
      techStack: values.techStack ?? [],
      category: values.category ?? "",
      status: values.status,
      featured: values.featured,
      featuredOrder: values.featuredOrder ?? 0,
      thumbnailUrl: values.thumbnailUrl ?? "",
      githubUrl: values.githubUrl ?? "",
      liveUrl: values.liveUrl ?? "",
    };

    try {
      if (isEdit && id) {
        await updateProject(id, payload, idToken);
        message.success("Project updated.");
      } else {
        await createProject(payload, idToken);
        message.success("Project created.");
      }
      navigate(ROUTES.ADMIN_PROJECTS);
    } catch {
      message.error("Failed to save project.");
    }
  };

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ maxWidth: 760, width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            {isEdit ? "Edit Project" : "Create Project"}
          </Typography.Title>
          <Typography.Text type="secondary">
            Configure project content, publication status, and links.
          </Typography.Text>
        </div>

        <Card>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="Title" validateStatus={errors.title ? "error" : ""} help={errors.title?.message}>
              <Controller name="title" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>

            <Form.Item label="Description" validateStatus={errors.description ? "error" : ""} help={errors.description?.message}>
              <Controller name="description" control={control} render={({ field }) => <Input.TextArea rows={5} {...field} />} />
            </Form.Item>

            <Form.Item label="Tech Stack" validateStatus={errors.techStack ? "error" : ""} help={errors.techStack?.message}>
              <Controller
                name="techStack"
                control={control}
                render={({ field }) => (
                  <Select mode="tags" placeholder="Add technologies" {...field} />
                )}
              />
            </Form.Item>

            <Form.Item label="Category" validateStatus={errors.category ? "error" : ""} help={errors.category?.message}>
              <Controller name="category" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>

            <Form.Item label="Status" validateStatus={errors.status ? "error" : ""} help={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "published", label: "Published" },
                    ]}
                  />
                )}
              />
            </Form.Item>

            <Space size="large" align="start" wrap>
              <Form.Item validateStatus={errors.featured ? "error" : ""} help={errors.featured?.message}>
                <Controller
                  name="featured"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)}>
                      Featured
                    </Checkbox>
                  )}
                />
              </Form.Item>

              <Form.Item label="Featured Order" validateStatus={errors.featuredOrder ? "error" : ""} help={errors.featuredOrder?.message}>
                <Controller
                  name="featuredOrder"
                  control={control}
                  render={({ field }) => (
                    <InputNumber min={0} value={field.value} onChange={field.onChange} />
                  )}
                />
              </Form.Item>
            </Space>

            <Form.Item label="Thumbnail URL" validateStatus={errors.thumbnailUrl ? "error" : ""} help={errors.thumbnailUrl?.message}>
              <Controller name="thumbnailUrl" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>

            <Form.Item label="GitHub URL" validateStatus={errors.githubUrl ? "error" : ""} help={errors.githubUrl?.message}>
              <Controller name="githubUrl" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>

            <Form.Item label="Live URL" validateStatus={errors.liveUrl ? "error" : ""} help={errors.liveUrl?.message}>
              <Controller name="liveUrl" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isEdit ? "Save Changes" : "Create Project"}
              </Button>
              <Button onClick={() => navigate(ROUTES.ADMIN_PROJECTS)}>
                Cancel
              </Button>
            </Space>
          </Form>
        </Card>
      </Space>
    </AdminLayout>
  );
};

export default ProjectFormPage;

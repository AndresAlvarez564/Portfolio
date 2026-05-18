import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Card, Checkbox, Form, Image, Input, InputNumber, Select, Space, Tabs, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import CaseStudyForm from "../../components/admin/CaseStudyForm";
import MediaUpload from "../../components/MediaUpload";

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
  thumbnailS3Key: yup.string().default(""),
  screenshotUrls: yup.array(yup.string().required()).default([]),
  screenshotKeys: yup.array(yup.string().required()).default([]),
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
  thumbnailS3Key: "",
  screenshotUrls: [],
  screenshotKeys: [],
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
  });
  const thumbnailUrl = useWatch({ control, name: "thumbnailUrl" });
  const screenshotUrls = useWatch({ control, name: "screenshotUrls" }) ?? [];
  const screenshotKeys = useWatch({ control, name: "screenshotKeys" }) ?? [];

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
        thumbnailS3Key: project.thumbnailS3Key ?? "",
        screenshotUrls: project.screenshotUrls ?? [],
        screenshotKeys: project.screenshotKeys ?? [],
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
      thumbnailS3Key: values.thumbnailS3Key ?? "",
      screenshotUrls: values.screenshotUrls ?? [],
      screenshotKeys: values.screenshotKeys ?? [],
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

  const removeScreenshot = (index: number) => {
    setValue("screenshotUrls", screenshotUrls.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true });
    setValue("screenshotKeys", screenshotKeys.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true });
  };

  return (
    <AdminLayout>
      <Space direction="vertical" size="large" style={{ maxWidth: 960, width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            {isEdit ? "Edit Project" : "Create Project"}
          </Typography.Title>
          <Typography.Text type="secondary">
            Configure project content, publication status, and links.
          </Typography.Text>
        </div>

        <Card>
          <Tabs
            items={[
              {
                key: "project",
                label: "Project",
                children: (
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

            <Card size="small" title="Thumbnail" style={{ marginBottom: 24 }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Controller name="thumbnailUrl" control={control} render={({ field }) => <Input {...field} placeholder="Thumbnail URL" />} />
                <MediaUpload
                  context="project-thumbnail"
                  mediaType="thumbnail"
                  relatedId={id}
                  accept="image/*"
                  label="Upload Thumbnail"
                  currentUrl={thumbnailUrl}
                  onUploadComplete={(media) => {
                    setValue("thumbnailUrl", media.cloudfrontUrl, { shouldDirty: true });
                    setValue("thumbnailS3Key", media.s3Key, { shouldDirty: true });
                  }}
                />
                {errors.thumbnailUrl?.message && (
                  <Typography.Text type="danger">{errors.thumbnailUrl.message}</Typography.Text>
                )}
              </Space>
            </Card>

            <Card size="small" title="Screenshots" style={{ marginBottom: 24 }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {screenshotUrls.length > 0 && (
                  <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    {screenshotUrls.map((url, index) => (
                      <Card
                        key={`${url}-${index}`}
                        size="small"
                        cover={<Image src={url} alt={`Project screenshot ${index + 1}`} height={140} style={{ objectFit: "cover" }} />}
                        actions={[
                          <Button
                            key="remove"
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeScreenshot(index)}
                          >
                            Remove
                          </Button>,
                        ]}
                      >
                        <Typography.Text ellipsis>{url}</Typography.Text>
                      </Card>
                    ))}
                  </div>
                )}
                <MediaUpload
                  context="project-screenshot"
                  mediaType="screenshot"
                  relatedId={id}
                  accept="image/*"
                  label="Upload Screenshot"
                  onUploadComplete={(media) => {
                    setValue("screenshotUrls", [...screenshotUrls, media.cloudfrontUrl], { shouldDirty: true });
                    setValue("screenshotKeys", [...screenshotKeys, media.s3Key], { shouldDirty: true });
                  }}
                />
              </Space>
            </Card>

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
                ),
              },
              ...(isEdit && idToken && id
                ? [{
                    key: "case-study",
                    label: "Case Study",
                    children: <CaseStudyForm idToken={idToken} projectId={id} />,
                  }]
                : []),
            ]}
          />
        </Card>
      </Space>
    </AdminLayout>
  );
};

export default ProjectFormPage;

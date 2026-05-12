import { useEffect } from "react";
import { Form, Input, Button, App } from "antd";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AdminLayout from "../../components/AdminLayout";
import { getProfile, updateProfile } from "../../services/profileService";
import { useAuthContext } from "../../context/AuthContext";
import type { ProfileData } from "../../types/profile";

const schema = yup.object({
  name:     yup.string().required("Name is required.").max(100),
  title:    yup.string().required("Title is required.").max(100),
  summary:  yup.string().required("Summary is required.").max(1000),
  location: yup.string().required("Location is required.").max(100),
  github:   yup.string().url("Must be a valid URL.").optional().default(""),
  linkedin: yup.string().url("Must be a valid URL.").optional().default(""),
  twitter:  yup.string().url("Must be a valid URL.").optional().default(""),
  website:  yup.string().url("Must be a valid URL.").optional().default(""),
});

type FormValues = yup.InferType<typeof schema>;

const ProfileSettingsPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  useEffect(() => {
    getProfile()
      .then((data) => reset({
        name:     data.name,
        title:    data.title,
        summary:  data.summary,
        location: data.location,
        github:   data.socialLinks?.github   ?? "",
        linkedin: data.socialLinks?.linkedin ?? "",
        twitter:  data.socialLinks?.twitter  ?? "",
        website:  data.socialLinks?.website  ?? "",
      }))
      .catch(() => message.error("Failed to load profile."));
  }, [reset, message]);

  const onSubmit = async (values: FormValues) => {
    if (!idToken) return;
    try {
      const payload: Partial<ProfileData> = {
        name:     values.name,
        title:    values.title,
        summary:  values.summary,
        location: values.location,
        socialLinks: {
          github:   values.github   || undefined,
          linkedin: values.linkedin || undefined,
          twitter:  values.twitter  || undefined,
          website:  values.website  || undefined,
        },
      };
      await updateProfile(payload, idToken);
      message.success("Profile updated successfully.");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      message.error(apiErr?.message ?? "Failed to update profile.");
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 600 }}>
        <h2>Profile Settings</h2>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>

          <Form.Item label="Name" validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Form.Item label="Title" validateStatus={errors.title ? "error" : ""} help={errors.title?.message}>
            <Controller name="title" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Form.Item label="Summary" validateStatus={errors.summary ? "error" : ""} help={errors.summary?.message}>
            <Controller name="summary" control={control} render={({ field }) => <Input.TextArea rows={4} {...field} />} />
          </Form.Item>

          <Form.Item label="Location" validateStatus={errors.location ? "error" : ""} help={errors.location?.message}>
            <Controller name="location" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Form.Item label="GitHub URL" validateStatus={errors.github ? "error" : ""} help={errors.github?.message}>
            <Controller name="github" control={control} render={({ field }) => <Input {...field} placeholder="https://github.com/username" />} />
          </Form.Item>

          <Form.Item label="LinkedIn URL" validateStatus={errors.linkedin ? "error" : ""} help={errors.linkedin?.message}>
            <Controller name="linkedin" control={control} render={({ field }) => <Input {...field} placeholder="https://linkedin.com/in/username" />} />
          </Form.Item>

          <Form.Item label="Twitter URL" validateStatus={errors.twitter ? "error" : ""} help={errors.twitter?.message}>
            <Controller name="twitter" control={control} render={({ field }) => <Input {...field} placeholder="https://twitter.com/username" />} />
          </Form.Item>

          <Form.Item label="Website URL" validateStatus={errors.website ? "error" : ""} help={errors.website?.message}>
            <Controller name="website" control={control} render={({ field }) => <Input {...field} placeholder="https://yourwebsite.com" />} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </Form.Item>

        </Form>
      </div>
    </AdminLayout>
  );
};

export default ProfileSettingsPage;

import { useEffect, useRef, useState } from "react";
import { App, Avatar, Button, Card, Form, Input, Space, Typography } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AdminLayout from "../../components/AdminLayout";
import { getProfile, updateProfile } from "../../services/profileService";
import { uploadMediaFile } from "../../services/mediaService";
import { useAuthContext } from "../../context/AuthContext";
import type { ProfileData } from "../../types/profile";

const schema = yup.object({
  name:     yup.string().required("Name is required.").max(100),
  title:    yup.string().required("Title is required.").max(100),
  summary:  yup.string().required("Summary is required.").max(1000),
  location: yup.string().required("Location is required.").max(100),
  aboutIntro:  yup.string().max(1500, "About intro must not exceed 1500 characters.").optional().default(""),
  aboutFocus:  yup.string().max(1500, "Cloud focus must not exceed 1500 characters.").optional().default(""),
  aboutBuilds: yup.string().max(1500, "What I build must not exceed 1500 characters.").optional().default(""),
  aboutValues: yup.string().max(1000, "Work values must not exceed 1000 characters.").optional().default(""),
  contactEmail: yup.string().email("Must be a valid email.").optional().default(""),
  whatsapp:     yup.string().max(30, "Max 30 characters.").optional().default(""),
  contactNote:  yup.string().max(300, "Max 300 characters.").optional().default(""),
  github:   yup.string().url("Must be a valid URL.").optional().default(""),
  linkedin: yup.string().url("Must be a valid URL.").optional().default(""),
  twitter:  yup.string().url("Must be a valid URL.").optional().default(""),
  website:  yup.string().url("Must be a valid URL.").optional().default(""),
});

type FormValues = yup.InferType<typeof schema>;

const ProfileSettingsPage = () => {
  const { idToken } = useAuthContext();
  const { message } = App.useApp();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  useEffect(() => {
    getProfile()
      .then((data) => {
        setAvatarUrl(data.avatarUrl ?? "");
        reset({
          name:     data.name,
          title:    data.title,
          summary:  data.summary,
          location: data.location,
          aboutIntro:  data.aboutIntro  ?? "",
          aboutFocus:  data.aboutFocus  ?? "",
          aboutBuilds: data.aboutBuilds ?? "",
          aboutValues: data.aboutValues ?? "",
          contactEmail: data.contactEmail ?? "",
          whatsapp:     data.whatsapp     ?? "",
          contactNote:  data.contactNote  ?? "",
          github:   data.socialLinks?.github   ?? "",
          linkedin: data.socialLinks?.linkedin ?? "",
          twitter:  data.socialLinks?.twitter  ?? "",
          website:  data.socialLinks?.website  ?? "",
        });
      })
      .catch(() => message.error("Failed to load profile."));
  }, [reset, message]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idToken) return;
    setAvatarUploading(true);
    try {
      const record = await uploadMediaFile(file, idToken, "profile-avatar", "profile-avatar");
      const newUrl = record.cloudfrontUrl;
      setAvatarUrl(newUrl);
      const values = getValues();
      await updateProfile({
        name: values.name, title: values.title, summary: values.summary, location: values.location,
        aboutIntro: values.aboutIntro || undefined, aboutFocus: values.aboutFocus || undefined,
        aboutBuilds: values.aboutBuilds || undefined, aboutValues: values.aboutValues || undefined,
        contactEmail: values.contactEmail || undefined, whatsapp: values.whatsapp || undefined,
        contactNote: values.contactNote || undefined,
        socialLinks: { github: values.github || undefined, linkedin: values.linkedin || undefined,
          twitter: values.twitter || undefined, website: values.website || undefined },
        avatarUrl: newUrl,
      }, idToken);
      message.success("Profile photo updated.");
    } catch {
      message.error("Failed to upload photo.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!idToken) return;
    try {
      const payload: Partial<ProfileData> = {
        name:     values.name,
        title:    values.title,
        summary:  values.summary,
        location: values.location,
        aboutIntro:  values.aboutIntro  || undefined,
        aboutFocus:  values.aboutFocus  || undefined,
        aboutBuilds: values.aboutBuilds || undefined,
        aboutValues: values.aboutValues || undefined,
        avatarUrl: avatarUrl || undefined,
        contactEmail: values.contactEmail || undefined,
        whatsapp:     values.whatsapp     || undefined,
        contactNote:  values.contactNote  || undefined,
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
      <Space direction="vertical" size="large" style={{ maxWidth: 720, width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            Profile Settings
          </Typography.Title>
          <Typography.Text type="secondary">
            Edit the public About page profile information.
          </Typography.Text>
        </div>

        {/* Avatar upload */}
        <Card>
          <Space align="center" size={24}>
            <Avatar
              size={96}
              src={avatarUrl || undefined}
              icon={!avatarUrl ? <UserOutlined /> : undefined}
              style={{ flexShrink: 0 }}
            />
            <div>
              <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
                Profile Photo
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                JPG or PNG, max 5 MB. Displayed on the public homepage.
              </Typography.Text>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
              <Space>
                <Button
                  icon={<UploadOutlined />}
                  loading={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {avatarUrl && (
                  <Button
                    danger
                    disabled={avatarUploading}
                    onClick={async () => {
                      if (!idToken) return;
                      const values = getValues();
                      try {
                        await updateProfile({
                          name: values.name, title: values.title, summary: values.summary, location: values.location,
                          aboutIntro: values.aboutIntro || undefined, aboutFocus: values.aboutFocus || undefined,
                          aboutBuilds: values.aboutBuilds || undefined, aboutValues: values.aboutValues || undefined,
                          contactEmail: values.contactEmail || undefined, whatsapp: values.whatsapp || undefined,
                          contactNote: values.contactNote || undefined,
                          socialLinks: { github: values.github || undefined, linkedin: values.linkedin || undefined,
                            twitter: values.twitter || undefined, website: values.website || undefined },
                          avatarUrl: "",
                        }, idToken);
                        setAvatarUrl("");
                        message.success("Photo removed.");
                      } catch {
                        message.error("Failed to remove photo.");
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Space>
            </div>
          </Space>
        </Card>

        <Card>
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

          <Typography.Title level={4}>About Me Content</Typography.Title>

          <Form.Item label="About Intro / Story" validateStatus={errors.aboutIntro ? "error" : ""} help={errors.aboutIntro?.message}>
            <Controller name="aboutIntro" control={control} render={({ field }) => <Input.TextArea rows={5} {...field} />} />
          </Form.Item>

          <Form.Item label="Cloud / AWS Focus" validateStatus={errors.aboutFocus ? "error" : ""} help={errors.aboutFocus?.message}>
            <Controller name="aboutFocus" control={control} render={({ field }) => <Input.TextArea rows={4} {...field} />} />
          </Form.Item>

          <Form.Item label="What I Build" validateStatus={errors.aboutBuilds ? "error" : ""} help={errors.aboutBuilds?.message}>
            <Controller name="aboutBuilds" control={control} render={({ field }) => <Input.TextArea rows={4} {...field} />} />
          </Form.Item>

          <Form.Item label="Work Values" validateStatus={errors.aboutValues ? "error" : ""} help={errors.aboutValues?.message}>
            <Controller name="aboutValues" control={control} render={({ field }) => <Input.TextArea rows={3} {...field} />} />
          </Form.Item>

          <Typography.Title level={4}>Contact Info</Typography.Title>

          <Form.Item label="Public Email" validateStatus={errors.contactEmail ? "error" : ""} help={errors.contactEmail?.message}>
            <Controller name="contactEmail" control={control} render={({ field }) => <Input {...field} placeholder="hello@example.com" />} />
          </Form.Item>

          <Form.Item label="WhatsApp Number" validateStatus={errors.whatsapp ? "error" : ""} help={errors.whatsapp?.message}>
            <Controller name="whatsapp" control={control} render={({ field }) => <Input {...field} placeholder="+591 71234567" />} />
          </Form.Item>

          <Form.Item label="Availability / Note" validateStatus={errors.contactNote ? "error" : ""} help={errors.contactNote?.message}>
            <Controller name="contactNote" control={control} render={({ field }) => <Input.TextArea rows={2} {...field} placeholder="e.g. Open to freelance. Typically responds within 24h." />} />
          </Form.Item>

          <Typography.Title level={4}>Social Links</Typography.Title>

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

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </Form.Item>

          </Form>
        </Card>
      </Space>
    </AdminLayout>
  );
};

export default ProfileSettingsPage;

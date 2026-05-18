import { useEffect } from "react";
import { Button, Form, Input, Space, Switch, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MediaUpload from "../MediaUpload";
import type { Certification, CertificationInput } from "../../types/certification";

const datePattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const schema = yup.object({
  inProgress: yup.boolean().defined().default(false),
  name: yup.string().required("Name is required.").max(180),
  issuer: yup.string().required("Issuer is required.").max(160),
  issueDate: yup.string().defined().default("").when("inProgress", {
    is: true,
    then: (s) => s.test("optional-date", "Use YYYY-MM format.", (v) => !v || datePattern.test(v)),
    otherwise: (s) => s.required("Issue date is required.").matches(datePattern, "Use YYYY-MM format."),
  }),
  expirationDate: yup.string().defined().default("").test(
    "optional-date",
    "Use YYYY-MM format.",
    (value) => !value || datePattern.test(value),
  ),
  verificationUrl: yup.string().defined().default("").url("Enter a valid URL.").max(500),
  badgeUrl: yup.string().defined().default("").url("Enter a valid URL.").max(500),
  badgeS3Key: yup.string().defined().default("").max(500),
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  inProgress: false,
  name: "",
  issuer: "",
  issueDate: "",
  expirationDate: "",
  verificationUrl: "",
  badgeUrl: "",
  badgeS3Key: "",
};

interface CertificationFormProps {
  initialValue?: Certification | null;
  onCancel: () => void;
  onSubmit: (value: CertificationInput) => Promise<void>;
}

const CertificationForm = ({ initialValue, onCancel, onSubmit }: CertificationFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const badgeUrl = watch("badgeUrl");
  const inProgress = watch("inProgress");

  useEffect(() => {
    reset(initialValue ? {
      inProgress: initialValue.inProgress ?? false,
      name: initialValue.name,
      issuer: initialValue.issuer,
      issueDate: initialValue.issueDate ?? "",
      expirationDate: initialValue.expirationDate ?? "",
      verificationUrl: initialValue.verificationUrl ?? "",
      badgeUrl: initialValue.badgeUrl ?? "",
      badgeS3Key: initialValue.badgeS3Key ?? "",
    } : defaultValues);
  }, [initialValue, reset]);

  const submit = async (values: FormValues) => {
    await onSubmit({
      inProgress: values.inProgress,
      name: values.name,
      issuer: values.issuer,
      issueDate: values.issueDate,
      expirationDate: values.inProgress ? "" : values.expirationDate,
      verificationUrl: values.verificationUrl,
      badgeUrl: values.badgeUrl,
      badgeS3Key: values.badgeS3Key,
    });
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(submit)}>
      <Form.Item label="Status">
        <Space align="center">
          <Controller
            name="inProgress"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                checkedChildren="In Progress"
                unCheckedChildren="Completed"
              />
            )}
          />
          {inProgress && (
            <Typography.Text type="warning" style={{ fontSize: 12 }}>
              Issue date is optional for in-progress certifications.
            </Typography.Text>
          )}
        </Space>
      </Form.Item>

      <Form.Item label="Name" validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Issuer" validateStatus={errors.issuer ? "error" : ""} help={errors.issuer?.message}>
        <Controller name="issuer" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Space style={{ width: "100%" }} size="middle" align="start">
        <Form.Item
          label={inProgress ? "Issue Date (optional)" : "Issue Date"}
          validateStatus={errors.issueDate ? "error" : ""}
          help={errors.issueDate?.message}
        >
          <Controller name="issueDate" control={control} render={({ field }) => <Input {...field} placeholder="YYYY-MM" />} />
        </Form.Item>

        {!inProgress && (
          <Form.Item label="Expiration Date" validateStatus={errors.expirationDate ? "error" : ""} help={errors.expirationDate?.message}>
            <Controller name="expirationDate" control={control} render={({ field }) => <Input {...field} placeholder="YYYY-MM" />} />
          </Form.Item>
        )}
      </Space>

      <Form.Item label="Verification URL" validateStatus={errors.verificationUrl ? "error" : ""} help={errors.verificationUrl?.message}>
        <Controller name="verificationUrl" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Badge Image">
        <MediaUpload
          context="certification-badge"
          mediaType="certification-badge"
          currentUrl={badgeUrl}
          accept="image/*"
          label="Upload Badge"
          onUploadComplete={(media) => {
            setValue("badgeUrl", media.cloudfrontUrl, { shouldValidate: true });
            setValue("badgeS3Key", media.s3Key, { shouldValidate: true });
          }}
        />
      </Form.Item>

      <Form.Item label="Badge URL" validateStatus={errors.badgeUrl ? "error" : ""} help={errors.badgeUrl?.message}>
        <Controller name="badgeUrl" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Badge S3 Key" validateStatus={errors.badgeS3Key ? "error" : ""} help={errors.badgeS3Key?.message}>
        <Controller name="badgeS3Key" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Space>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Space>
    </Form>
  );
};

export default CertificationForm;

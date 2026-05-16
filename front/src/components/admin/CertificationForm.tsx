import { useEffect, useState } from "react";
import { Alert, Button, Form, Image, Input, Space, Upload } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { uploadMediaFile } from "../../services/mediaService";
import type { Certification, CertificationInput } from "../../types/certification";

const datePattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const schema = yup.object({
  name: yup.string().required("Name is required.").max(180),
  issuer: yup.string().required("Issuer is required.").max(160),
  issueDate: yup.string().required("Issue date is required.").matches(datePattern, "Use YYYY-MM format."),
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
  name: "",
  issuer: "",
  issueDate: "",
  expirationDate: "",
  verificationUrl: "",
  badgeUrl: "",
  badgeS3Key: "",
};

interface CertificationFormProps {
  idToken: string | null;
  initialValue?: Certification | null;
  onCancel: () => void;
  onSubmit: (value: CertificationInput) => Promise<void>;
}

const CertificationForm = ({ idToken, initialValue, onCancel, onSubmit }: CertificationFormProps) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  useEffect(() => {
    reset(initialValue ? {
      name: initialValue.name,
      issuer: initialValue.issuer,
      issueDate: initialValue.issueDate,
      expirationDate: initialValue.expirationDate ?? "",
      verificationUrl: initialValue.verificationUrl ?? "",
      badgeUrl: initialValue.badgeUrl ?? "",
      badgeS3Key: initialValue.badgeS3Key ?? "",
    } : defaultValues);
    setUploadError(null);
  }, [initialValue, reset]);

  const submit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      issuer: values.issuer,
      issueDate: values.issueDate,
      expirationDate: values.expirationDate,
      verificationUrl: values.verificationUrl,
      badgeUrl: values.badgeUrl,
      badgeS3Key: values.badgeS3Key,
    });
  };

  const uploadBadge: UploadProps["customRequest"] = async (options) => {
    if (!idToken || !(options.file instanceof File)) {
      setUploadError("Sign in again before uploading a badge.");
      options.onError?.(new Error("Missing upload token."));
      return;
    }

    setUploadError(null);
    try {
      const media = await uploadMediaFile(options.file, idToken);
      setValue("badgeUrl", media.cloudfrontUrl ?? media.url ?? "", { shouldValidate: true });
      setValue("badgeS3Key", media.s3Key, { shouldValidate: true });
      options.onSuccess?.(media);
    } catch (error) {
      setUploadError("Badge upload failed. You can still paste a badge URL manually.");
      options.onError?.(error as Error);
    }
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(submit)}>
      <Form.Item label="Name" validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Issuer" validateStatus={errors.issuer ? "error" : ""} help={errors.issuer?.message}>
        <Controller name="issuer" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Space style={{ width: "100%" }} size="middle" align="start">
        <Form.Item label="Issue Date" validateStatus={errors.issueDate ? "error" : ""} help={errors.issueDate?.message}>
          <Controller name="issueDate" control={control} render={({ field }) => <Input {...field} placeholder="YYYY-MM" />} />
        </Form.Item>

        <Form.Item label="Expiration Date" validateStatus={errors.expirationDate ? "error" : ""} help={errors.expirationDate?.message}>
          <Controller name="expirationDate" control={control} render={({ field }) => <Input {...field} placeholder="YYYY-MM" />} />
        </Form.Item>
      </Space>

      <Form.Item label="Verification URL" validateStatus={errors.verificationUrl ? "error" : ""} help={errors.verificationUrl?.message}>
        <Controller name="verificationUrl" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Badge Image">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {badgeUrl && <Image src={badgeUrl} alt="Certification badge preview" width={96} height={96} style={{ objectFit: "contain" }} />}
          <Upload customRequest={uploadBadge} maxCount={1} accept="image/*" showUploadList={false}>
            <Button icon={<UploadOutlined />}>Upload Badge</Button>
          </Upload>
          {uploadError && <Alert type="warning" message={uploadError} showIcon />}
        </Space>
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

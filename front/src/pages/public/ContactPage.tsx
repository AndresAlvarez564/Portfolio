import { useState } from "react";
import { Alert, Button, Form, Input, Result, Space, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { submitContact } from "../../services/contactService";
import type { ContactFormData } from "../../types/contact";

const schema = yup.object({
  name: yup.string().required("Name is required.").max(120),
  email: yup.string().required("Email is required.").email("Enter a valid email.").max(254),
  company: yup.string().defined().default("").max(160),
  projectType: yup.string().defined().default("").max(120),
  budget: yup.string().defined().default("").max(80),
  subject: yup.string().required("Subject is required.").max(180),
  message: yup.string().required("Message is required.").max(2000),
  website: yup.string().defined().default(""),
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  name: "",
  email: "",
  company: "",
  projectType: "",
  budget: "",
  subject: "",
  message: "",
  website: "",
};

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const submit = async (values: ContactFormData) => {
    setSubmitError(null);
    try {
      await submitContact(values);
      setSubmitted(true);
    } catch {
      setSubmitError("Failed to send your message. Please try again.");
    }
  };

  if (submitted) {
    return (
      <main style={{ margin: "0 auto", maxWidth: 760, padding: 24 }}>
        <Result
          status="success"
          title="Your message has been sent."
          subTitle="Thanks for reaching out. I will follow up as soon as possible."
        />
      </main>
    );
  }

  return (
    <main style={{ margin: "0 auto", maxWidth: 760, padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Contact
          </Typography.Title>
          <Typography.Text type="secondary">
            Share the project details and the best way to reach you.
          </Typography.Text>
        </div>

        {submitError && <Alert type="error" message={submitError} showIcon />}

        <Form layout="vertical" onFinish={handleSubmit(submit)}>
          <Form.Item label="Name" validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Form.Item label="Email" validateStatus={errors.email ? "error" : ""} help={errors.email?.message}>
            <Controller name="email" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Space style={{ width: "100%" }} size="middle" align="start">
            <Form.Item label="Company" validateStatus={errors.company ? "error" : ""} help={errors.company?.message}>
              <Controller name="company" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
            <Form.Item label="Budget" validateStatus={errors.budget ? "error" : ""} help={errors.budget?.message}>
              <Controller name="budget" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Space>

          <Form.Item label="Project Type" validateStatus={errors.projectType ? "error" : ""} help={errors.projectType?.message}>
            <Controller name="projectType" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Form.Item label="Subject" validateStatus={errors.subject ? "error" : ""} help={errors.subject?.message}>
            <Controller name="subject" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Form.Item label="Message" validateStatus={errors.message ? "error" : ""} help={errors.message?.message}>
            <Controller name="message" control={control} render={({ field }) => <Input.TextArea rows={7} {...field} />} />
          </Form.Item>

          <div aria-hidden="true" style={{ height: 0, left: -10000, overflow: "hidden", position: "absolute", width: 0 }}>
            <Controller name="website" control={control} render={({ field }) => <Input {...field} tabIndex={-1} autoComplete="off" />} />
          </div>

          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Send Message
          </Button>
        </Form>
      </Space>
    </main>
  );
};

export default ContactPage;

import { useEffect } from "react";
import { Button, Checkbox, Form, Input, Space } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { Experience, ExperienceInput } from "../../types/experience";

const schema = yup.object({
  company: yup.string().required("Company is required.").max(160),
  title: yup.string().required("Title is required.").max(160),
  description: yup.string().required("Description is required.").max(2000),
  startDate: yup.string().required("Start date is required.").max(20),
  endDate: yup.string().defined().default("").when("current", {
    is: false,
    then: (field) => field.required("End date is required when current is false.").max(20),
    otherwise: (field) => field.default(""),
  }),
  current: yup.boolean().required().default(true),
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  company: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  current: true,
};

interface ExperienceFormProps {
  initialValue?: Experience | null;
  onCancel: () => void;
  onSubmit: (value: ExperienceInput) => Promise<void>;
}

const ExperienceForm = ({ initialValue, onCancel, onSubmit }: ExperienceFormProps) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const current = watch("current");

  useEffect(() => {
    reset(initialValue ? {
      company: initialValue.company,
      title: initialValue.title,
      description: initialValue.description,
      startDate: initialValue.startDate,
      endDate: initialValue.endDate ?? "",
      current: initialValue.current,
    } : defaultValues);
  }, [initialValue, reset]);

  const submit = async (values: FormValues) => {
    await onSubmit({
      company: values.company,
      title: values.title,
      description: values.description,
      startDate: values.startDate,
      endDate: values.current ? "" : values.endDate,
      current: values.current,
    });
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(submit)}>
      <Form.Item label="Company" validateStatus={errors.company ? "error" : ""} help={errors.company?.message}>
        <Controller name="company" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Title" validateStatus={errors.title ? "error" : ""} help={errors.title?.message}>
        <Controller name="title" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Description" validateStatus={errors.description ? "error" : ""} help={errors.description?.message}>
        <Controller name="description" control={control} render={({ field }) => <Input.TextArea rows={5} {...field} />} />
      </Form.Item>

      <Form.Item label="Start Date" validateStatus={errors.startDate ? "error" : ""} help={errors.startDate?.message}>
        <Controller name="startDate" control={control} render={({ field }) => <Input {...field} placeholder="YYYY-MM" />} />
      </Form.Item>

      <Form.Item validateStatus={errors.current ? "error" : ""} help={errors.current?.message}>
        <Controller
          name="current"
          control={control}
          render={({ field }) => (
            <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)}>
              Current role
            </Checkbox>
          )}
        />
      </Form.Item>

      {!current && (
        <Form.Item label="End Date" validateStatus={errors.endDate ? "error" : ""} help={errors.endDate?.message}>
          <Controller name="endDate" control={control} render={({ field }) => <Input {...field} placeholder="YYYY-MM" />} />
        </Form.Item>
      )}

      <Space>
        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Space>
    </Form>
  );
};

export default ExperienceForm;

import { useEffect } from "react";
import { Button, Form, Input, InputNumber, Select, Space } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  SKILL_CATEGORIES,
  SKILL_VISIBILITIES,
  type Skill,
  type SkillCategory,
  type SkillInput,
  type SkillVisibility,
} from "../../types/skill";

const schema = yup.object({
  name: yup.string().required("Name is required.").max(120),
  category: yup
    .mixed<SkillCategory>()
    .oneOf([...SKILL_CATEGORIES])
    .required("Category is required."),
  visibility: yup
    .mixed<SkillVisibility>()
    .oneOf([...SKILL_VISIBILITIES])
    .required("Visibility is required."),
  order: yup.number().required("Order is required.").min(0).integer().default(0),
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  name: "",
  category: "backend",
  visibility: "visible",
  order: 0,
};

interface SkillFormProps {
  initialValue?: Skill | null;
  onCancel: () => void;
  onSubmit: (value: SkillInput) => Promise<void>;
}

const categoryOptions = SKILL_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const visibilityOptions = SKILL_VISIBILITIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

const SkillForm = ({ initialValue, onCancel, onSubmit }: SkillFormProps) => {
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
    reset(initialValue ? {
      name: initialValue.name,
      category: initialValue.category,
      visibility: initialValue.visibility,
      order: initialValue.order,
    } : defaultValues);
  }, [initialValue, reset]);

  const submit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      category: values.category,
      visibility: values.visibility,
      order: values.order,
    });
  };

  return (
    <Form layout="vertical" onFinish={handleSubmit(submit)}>
      <Form.Item label="Name" validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
        <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
      </Form.Item>

      <Form.Item label="Category" validateStatus={errors.category ? "error" : ""} help={errors.category?.message}>
        <Controller name="category" control={control} render={({ field }) => <Select {...field} options={categoryOptions} />} />
      </Form.Item>

      <Form.Item label="Visibility" validateStatus={errors.visibility ? "error" : ""} help={errors.visibility?.message}>
        <Controller name="visibility" control={control} render={({ field }) => <Select {...field} options={visibilityOptions} />} />
      </Form.Item>

      <Form.Item label="Order" validateStatus={errors.order ? "error" : ""} help={errors.order?.message}>
        <Controller
          name="order"
          control={control}
          render={({ field }) => (
            <InputNumber
              min={0}
              precision={0}
              style={{ width: "100%" }}
              value={field.value}
              onChange={(value) => field.onChange(value ?? 0)}
              onBlur={field.onBlur}
            />
          )}
        />
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

export default SkillForm;

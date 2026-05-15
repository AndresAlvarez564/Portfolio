import { useEffect } from "react";
import { App, Button, Form, Input, Space, Typography } from "antd";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getCaseStudy, upsertCaseStudy } from "../../services/projectsService";
import type { CaseStudyInput } from "../../types/caseStudy";

const schema = yup.object({
  problem: yup.string().required("Problem is required.").max(2000),
  solution: yup.string().required("Solution is required.").max(3000),
  architecture: yup.string().required("Architecture is required.").max(3000),
  challenges: yup.string().max(3000).default(""),
  results: yup.string().max(3000).default(""),
});

type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  problem: "",
  solution: "",
  architecture: "",
  challenges: "",
  results: "",
};

interface CaseStudyFormProps {
  idToken: string;
  projectId: string;
}

const CaseStudyForm = ({ idToken, projectId }: CaseStudyFormProps) => {
  const { message } = App.useApp();
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
    getCaseStudy(projectId)
      .then((caseStudy) => {
        if (!caseStudy) return;
        reset({
          problem: caseStudy.problem,
          solution: caseStudy.solution,
          architecture: caseStudy.architecture,
          challenges: caseStudy.challenges ?? "",
          results: caseStudy.results ?? "",
        });
      })
      .catch(() => message.error("Failed to load case study."));
  }, [message, projectId, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload: CaseStudyInput = {
      problem: values.problem,
      solution: values.solution,
      architecture: values.architecture,
      challenges: values.challenges ?? "",
      results: values.results ?? "",
    };

    try {
      await upsertCaseStudy(projectId, payload, idToken);
      message.success("Case study saved.");
    } catch {
      message.error("Failed to save case study.");
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div>
        <Typography.Title level={4} style={{ marginBottom: 0 }}>
          Case Study
        </Typography.Title>
        <Typography.Text type="secondary">
          Add detailed problem, solution, architecture, challenges, and results.
        </Typography.Text>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item label="Problem" validateStatus={errors.problem ? "error" : ""} help={errors.problem?.message}>
          <Controller name="problem" control={control} render={({ field }) => <Input.TextArea rows={5} {...field} />} />
        </Form.Item>

        <Form.Item label="Solution" validateStatus={errors.solution ? "error" : ""} help={errors.solution?.message}>
          <Controller name="solution" control={control} render={({ field }) => <Input.TextArea rows={5} {...field} />} />
        </Form.Item>

        <Form.Item label="Architecture" validateStatus={errors.architecture ? "error" : ""} help={errors.architecture?.message}>
          <Controller name="architecture" control={control} render={({ field }) => <Input.TextArea rows={5} {...field} />} />
        </Form.Item>

        <Form.Item label="Challenges" validateStatus={errors.challenges ? "error" : ""} help={errors.challenges?.message}>
          <Controller name="challenges" control={control} render={({ field }) => <Input.TextArea rows={4} {...field} />} />
        </Form.Item>

        <Form.Item label="Results" validateStatus={errors.results ? "error" : ""} help={errors.results?.message}>
          <Controller name="results" control={control} render={({ field }) => <Input.TextArea rows={4} {...field} />} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={isSubmitting}>
          Save Case Study
        </Button>
      </Form>
    </Space>
  );
};

export default CaseStudyForm;

// LoginPage — admin login form connected to Cognito via Amplify v6.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Alert } from "antd";
import { useAuthContext } from "../../context/AuthContext";
import { ROUTES } from "../../constants";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const { signIn, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Already authenticated — redirect to dashboard
  if (isAuthenticated) {
    navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    return null;
  }

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signIn(values.email, values.password);
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed. Check your credentials.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card title="Admin Login" className="w-full max-w-sm shadow">
        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            className="mb-4"
            closable
            onClose={() => setErrorMsg(null)}
          />
        )}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email", message: "Enter a valid email." }]}
          >
            <Input placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required." }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </main>
  );
};

export default LoginPage;

// AccessDeniedPage — shown when an authenticated user lacks the required group.

import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { ROUTES } from "../../constants";

const AccessDeniedPage = () => {
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.ADMIN_LOGIN, { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <Result
        status="403"
        title="Access Denied"
        subTitle="You do not have permission to access this page."
        extra={
          <Button type="primary" onClick={handleSignOut}>
            Sign out
          </Button>
        }
      />
    </main>
  );
};

export default AccessDeniedPage;

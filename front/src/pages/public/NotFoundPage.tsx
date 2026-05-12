// NotFoundPage — 404 fallback for unknown routes.

import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";

const NotFoundPage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <Link to={ROUTES.HOME} className="text-blue-600 underline">
        Go home
      </Link>
    </main>
  );
};

export default NotFoundPage;

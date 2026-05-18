import { Link } from "react-router-dom";
import { ROUTES } from "../../constants";

const NotFoundPage = () => (
  <main style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 16, justifyContent: "center", minHeight: "80vh" }}>
    <h1 className="gradient-text" style={{ fontSize: 80, fontWeight: 800, lineHeight: 1, margin: 0 }}>404</h1>
    <p style={{ color: "#6b7280", fontSize: 18, margin: 0 }}>Page not found.</p>
    <Link
      to={ROUTES.HOME}
      style={{ color: "#22d3ee", fontSize: 15, fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(34,211,238,0.4)", paddingBottom: 2 }}
    >
      Go home
    </Link>
  </main>
);

export default NotFoundPage;

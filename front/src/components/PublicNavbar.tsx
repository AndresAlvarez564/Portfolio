import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { ROUTES } from "../constants";

const links = [
  { label: "Home", to: ROUTES.HOME },
  { label: "Projects", to: ROUTES.PROJECTS },
  { label: "Certifications", to: ROUTES.CERTIFICATIONS },
  { label: "Contact", to: ROUTES.CONTACT },
];

const PublicNavbar = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    to === ROUTES.HOME ? pathname === "/" : pathname.startsWith(to);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(9, 9, 9, 0.88)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          margin: "0 auto",
          maxWidth: 1120,
          height: 60,
          padding: "0 24px",
        }}
      >
        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          style={{
            color: "#22d3ee",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          {"<portfolio />"}
        </Link>

        {/* Desktop links */}
        <div className="nav-links-desktop" style={{ gap: 2 }}>
          {links.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${isActive(to) ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: 20,
            padding: 8,
            display: "none",
          }}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="nav-mobile-menu"
          style={{
            background: "rgba(9,9,9,0.97)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "12px 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {links.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${isActive(to) ? " active" : ""}`}
              style={{ display: "block", padding: "10px 12px" }}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;

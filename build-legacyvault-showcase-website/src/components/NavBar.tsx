import { motion } from "framer-motion";
import { Section } from "../App";

interface NavBarProps {
  active: Section;
  onNav: (s: Section) => void;
}

const links: { id: Section; label: string }[] = [
  { id: "hero", label: "Home" },
  { id: "how", label: "How It Works" },
  { id: "features", label: "Features" },
  { id: "architecture", label: "Architecture" },
  { id: "tech", label: "Tech Stack" },
];

export default function NavBar({ active, onNav }: NavBarProps) {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        height: "64px",
        background: "rgba(5,10,20,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
      }}
    >
      {/* Logo */}
      <button
        onClick={() => onNav("hero")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <VaultLogo />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            background: "linear-gradient(135deg, #a78bfa, #14b8a6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          LEGACY<span style={{ color: "#7c3aed" }}>VAULT</span>
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "4px" }}>
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => onNav(link.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "'Space Grotesk', sans-serif",
              color: active === link.id ? "#a78bfa" : "rgba(226,232,240,0.6)",
              position: "relative",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (active !== link.id)
                (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              if (active !== link.id)
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(226,232,240,0.6)";
            }}
          >
            {link.label}
            {active === link.id && (
              <motion.div
                layoutId="nav-indicator"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "10%",
                  right: "10%",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, #7c3aed, #14b8a6)",
                  borderRadius: "1px",
                }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* CTA */}
      <a
        href="https://github.com/knarayanareddy/LEGACYVAULTV1.0"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(20,184,166,0.1))",
          border: "1px solid rgba(124,58,237,0.35)",
          color: "#a78bfa",
          padding: "7px 16px",
          borderRadius: "7px",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          transition: "all 0.25s",
          letterSpacing: "0.3px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(20,184,166,0.2))";
          (e.currentTarget as HTMLElement).style.color = "white";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 0 20px rgba(124,58,237,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(20,184,166,0.1))";
          (e.currentTarget as HTMLElement).style.color = "#a78bfa";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <GithubIcon />
        GitHub
      </a>
    </motion.nav>
  );
}

function VaultLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="5"
        stroke="url(#vgrad)"
        strokeWidth="1.5"
        fill="rgba(124,58,237,0.1)"
      />
      <circle cx="14" cy="14" r="6" stroke="url(#vgrad)" strokeWidth="1.5" fill="none" />
      <circle cx="14" cy="14" r="2" fill="url(#vgrad)" />
      <line x1="14" y1="2" x2="14" y2="8" stroke="url(#vgrad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="20" x2="14" y2="26" stroke="url(#vgrad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="14" x2="8" y2="14" stroke="url(#vgrad)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="14" x2="26" y2="14" stroke="url(#vgrad)" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="vgrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

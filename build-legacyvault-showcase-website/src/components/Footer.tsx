import { Section } from "../App";

interface Props {
  onNav: (s: Section) => void;
}

const navLinks: { id: Section; label: string }[] = [
  { id: "hero", label: "Home" },
  { id: "how", label: "How It Works" },
  { id: "features", label: "Features" },
  { id: "architecture", label: "Architecture" },
  { id: "tech", label: "Tech Stack" },
];

export default function Footer({ onNav }: Props) {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(124,58,237,0.12)",
        background: "rgba(5,10,20,0.98)",
        padding: "48px 40px 32px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "32px",
          }}
        >
          {/* Logo + tagline */}
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: "20px",
                letterSpacing: "1px",
                background: "linear-gradient(135deg, #a78bfa, #14b8a6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "8px",
              }}
            >
              LEGACY<span style={{ WebkitTextFillColor: "#7c3aed" }}>VAULT</span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(226,232,240,0.4)", maxWidth: 280, lineHeight: 1.6 }}>
              Solana-native digital estate executor. Programmable inheritance, on-chain.
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNav(link.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(226,232,240,0.45)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: "color 0.2s",
                  padding: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(226,232,240,0.45)"; }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* External links */}
          <div style={{ display: "flex", gap: "12px" }}>
            <a
              href="https://github.com/knarayanareddy/LEGACYVAULTV1.0"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "rgba(226,232,240,0.45)",
                fontSize: "13px",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a78bfa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(226,232,240,0.45)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://colosseum.com/frontier"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "rgba(226,232,240,0.45)",
                fontSize: "13px",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#14b8a6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(226,232,240,0.45)"; }}
            >
              🏆 Colosseum
            </a>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(124,58,237,0.08)",
            paddingTop: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "12px", color: "rgba(226,232,240,0.25)" }}>
            Built for the Colosseum Frontier Hackathon 2025 · Solana Ecosystem
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {/* Solana badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "rgba(153,69,255,0.6)",
              }}
            >
              <span style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#9945FF",
                boxShadow: "0 0 6px #9945FF",
              }} />
              Solana Native
            </div>
            {/* Anchor badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "rgba(20,184,166,0.6)",
              }}
            >
              <span style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#14b8a6",
                boxShadow: "0 0 6px #14b8a6",
              }} />
              Anchor v0.30.1
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const stack = [
  {
    category: "Blockchain",
    color: "#9945FF",
    emoji: "⛓️",
    items: [
      {
        name: "Solana",
        role: "L1 — <400ms finality, sub-cent fees",
        detail: "All vault state lives on Solana. The program exploits Solana's account model for safe PDA-based asset custody. No bridges, no rollups.",
        badge: "Native",
      },
      {
        name: "Anchor Framework",
        role: "Smart contract framework v0.30.1",
        detail: "Anchor provides type-safe account constraints, auto-discriminators, IDL generation, and the #[account] macro for all 12 PDA account types.",
        badge: "v0.30.1",
      },
      {
        name: "SPL Token + Token-2022",
        role: "Multi-standard token support",
        detail: "The vault accepts any SPL token or Token-2022 token. Distribution handles Associated Token Account creation for beneficiaries who don't yet have an ATA.",
        badge: "Multi-std",
      },
    ],
  },
  {
    category: "Indexing",
    color: "#0ea5e9",
    emoji: "📡",
    items: [
      {
        name: "Solana Geyser Plugin",
        role: "Real-time event streaming",
        detail: "The indexer subscribes to the validator's Geyser plugin interface, receiving every account update and transaction involving the LegacyVault program ID.",
        badge: "gRPC",
      },
      {
        name: "PostgreSQL",
        role: "Event & state persistence",
        detail: "All 38 on-chain events are decoded and stored in PostgreSQL. Tables: vaults, guardians, beneficiaries, unlock_sessions, distributions, disputes.",
        badge: "Event Store",
      },
      {
        name: "WebSocket Push",
        role: "Live dashboard updates",
        detail: "The indexer maintains WebSocket connections to dashboard clients, pushing vault state changes in real time — no polling required.",
        badge: "Realtime",
      },
    ],
  },
  {
    category: "Infrastructure",
    color: "#f59e0b",
    emoji: "🏗️",
    items: [
      {
        name: "Docker Compose",
        role: "Local development stack",
        detail: "infra/ contains Docker Compose configuration spinning up localnet validator, PostgreSQL, the indexer, and the API in a single command.",
        badge: "Containerised",
      },
      {
        name: "GitHub Actions",
        role: "CI — anchor build + test",
        detail: ".github/workflows runs anchor build and ts-mocha integration tests on every push. Tests cover all 28 instructions across 11 program modules.",
        badge: "CI",
      },
      {
        name: "Arweave / S3",
        role: "Encrypted document storage",
        detail: "Document files are stored off-chain. Only the SHA-256 hash and a URI are committed to the Vault PDA, keeping on-chain storage costs minimal.",
        badge: "Off-chain",
      },
    ],
  },
  {
    category: "Frontend",
    color: "#14b8a6",
    emoji: "🖥️",
    items: [
      {
        name: "Next.js + React",
        role: "Dashboard UI",
        detail: "dashboard/ is a Next.js app using @solana/wallet-adapter for Phantom / Solflare / Backpack connections and @coral-xyz/anchor for program calls.",
        badge: "Next.js",
      },
      {
        name: "@solana/wallet-adapter",
        role: "Wallet integration layer",
        detail: "Supports Phantom, Solflare, Backpack, and any wallet supporting the Wallet Standard. Handles transaction signing and RPC submission.",
        badge: "Multi-wallet",
      },
      {
        name: "REST API",
        role: "Indexed data access",
        detail: "api/ exposes /vault/:pubkey, /guardian/:wallet, and /unlock/:session endpoints backed by the PostgreSQL event store for fast reads without RPC calls.",
        badge: "REST",
      },
    ],
  },
];

const metrics = [
  { label: "Program Modules", value: "11", sub: "A through K", color: "#7c3aed" },
  { label: "Instructions", value: "28", sub: "All typed args", color: "#0ea5e9" },
  { label: "Account Types", value: "12", sub: "PDA-based", color: "#14b8a6" },
  { label: "Events Emitted", value: "38", sub: "Full audit trail", color: "#f59e0b" },
  { label: "Error Codes", value: "63", sub: "User-facing msgs", color: "#ec4899" },
  { label: "Max Beneficiaries", value: "255", sub: "Enterprise tier", color: "#22c55e" },
];

export default function TechStack() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(124,58,237,0.07) 0%, transparent 60%), #050a14",
        }}
      />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.35 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "3px",
              color: "#14b8a6",
              marginBottom: "12px",
            }}
          >
            BUILT WITH
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 700,
              background: "linear-gradient(135deg, #e2e8f0, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "12px",
              letterSpacing: "-0.5px",
            }}
          >
            Tech Stack
          </h2>
        </motion.div>

        {/* Metrics bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="metrics-grid-6"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "1px",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.12)",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "48px",
          }}
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              onMouseEnter={() => setHoveredMetric(m.label)}
              onMouseLeave={() => setHoveredMetric(null)}
              style={{
                background:
                  hoveredMetric === m.label
                    ? `rgba(${hexToRgb(m.color)},0.15)`
                    : "rgba(10,22,40,0.9)",
                padding: "22px 16px",
                textAlign: "center",
                transition: "background 0.3s",
                cursor: "default",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: m.color,
                  marginBottom: "4px",
                  lineHeight: 1,
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.6)", marginBottom: "2px" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(226,232,240,0.3)" }}>{m.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Stack categories */}
        <div className="stack-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {stack.map((cat, ci) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 + 0.2 }}
              style={{
                background: "rgba(10,22,40,0.85)",
                border: "1px solid rgba(124,58,237,0.12)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {/* Category header */}
              <button
                onClick={() =>
                  setActiveCategory(activeCategory === cat.category ? null : cat.category)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(124,58,237,0.08)",
                  transition: "background 0.2s",
                }}
              >
                <span style={{ fontSize: "22px" }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: cat.color,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {cat.category}
                </span>
                <span style={{ marginLeft: "auto", color: cat.color, fontSize: "12px" }}>
                  {cat.items.length} technologies
                </span>
                <span
                  style={{
                    color: "rgba(226,232,240,0.4)",
                    transition: "transform 0.3s",
                    transform:
                      activeCategory === cat.category ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Items */}
              <div style={{ padding: "16px" }}>
                {cat.items.map((item) => (
                  <StackItem
                    key={item.name}
                    item={item}
                    color={cat.color}
                    expanded={activeCategory === cat.category}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hackathon footer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: "56px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(20,184,166,0.06))",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: "20px",
            padding: "40px 48px",
            display: "flex",
            alignItems: "center",
            gap: "32px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "240px" }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#14b8a6",
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              SUBMITTED TO
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "6px",
              }}
            >
              Colosseum Frontier Hackathon
            </div>
            <div style={{ fontSize: "14px", color: "rgba(226,232,240,0.5)" }}>
              DeFi / Infrastructure Track · 2025
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <a
              href="https://github.com/knarayanareddy/LEGACYVAULTV1.0"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(124,58,237,0.2)",
                border: "1px solid rgba(124,58,237,0.35)",
                color: "#a78bfa",
                padding: "10px 22px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.35)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.2)";
                (e.currentTarget as HTMLElement).style.color = "#a78bfa";
              }}
            >
              <GithubSVG /> View on GitHub
            </a>
            <a
              href="https://colosseum.com/frontier"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(20,184,166,0.15)",
                border: "1px solid rgba(20,184,166,0.3)",
                color: "#14b8a6",
                padding: "10px 22px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(20,184,166,0.3)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(20,184,166,0.15)";
                (e.currentTarget as HTMLElement).style.color = "#14b8a6";
              }}
            >
              🏆 Hackathon
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StackItem({
  item,
  color,
  expanded,
}: {
  item: { name: string; role: string; detail: string; badge: string };
  color: string;
  expanded: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${hexToRgb(color)},0.08)` : "transparent",
        border: `1px solid ${hovered ? color + "30" : "transparent"}`,
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "8px",
        transition: "all 0.25s",
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: hovered && expanded ? "8px" : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: hovered ? color : "#e2e8f0", transition: "color 0.25s" }}>
              {item.name}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: color,
                background: `rgba(${hexToRgb(color)},0.12)`,
                border: `1px solid ${color}30`,
                padding: "2px 6px",
                borderRadius: "4px",
                letterSpacing: "0.5px",
              }}
            >
              {item.badge}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(226,232,240,0.45)" }}>{item.role}</div>
        </div>
      </div>
      <AnimatePresence>
        {hovered && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ fontSize: "12px", color: "rgba(226,232,240,0.65)", lineHeight: 1.6, marginTop: "8px" }}>
              {item.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : "124,58,237";
}

function GithubSVG() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

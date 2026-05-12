import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    id: "vault",
    icon: "🏛️",
    title: "Programmable Vaults",
    tagline: "Your assets, your rules",
    color: "#7c3aed",
    points: [
      "PDA-based vault authority — no custodian",
      "Supports SOL + any SPL / Token-2022 token",
      "Multiple vaults per owner (via nonce)",
      "Pause / freeze safety switch",
    ],
    detail: "Each vault is a fully on-chain Solana account (Program Derived Address). Assets sit in the vault authority PDA — controlled purely by the program's logic. No multisig key held by any company.",
  },
  {
    id: "guardian",
    icon: "🛡️",
    title: "Guardian Council",
    tagline: "M-of-N consensus on-chain",
    color: "#0ea5e9",
    points: [
      "Personal, Professional & Delegate roles",
      "Configurable M-of-N approval threshold",
      "Professional guardians post on-chain bonds",
      "Slashing mechanism for misconduct",
    ],
    detail: "Guardians are invited wallets who collectively decide when an estate should unlock. Only M of the N active guardians need to approve. Professional guardians must post SOL bonds — slashable by admin if they behave maliciously.",
  },
  {
    id: "liveness",
    icon: "💓",
    title: "Liveness System",
    tagline: "Proof-of-life check-ins",
    color: "#f59e0b",
    points: [
      "30 – 365 day configurable inactivity window",
      "Delegate check-in on behalf of owner",
      "Last check-in timestamp stored on-chain",
      "Threshold triggers guardian unlock ability",
    ],
    detail: "The owner (or a liveness delegate) calls check_in() to reset the inactivity clock. If the clock runs out without a check-in, guardians become able to initiate the unlock sequence — no off-chain oracle needed.",
  },
  {
    id: "timelock",
    icon: "⏱️",
    title: "Time-Locked Unlock",
    tagline: "Owner always gets to cancel",
    color: "#ec4899",
    points: [
      "1 – 90 day configurable timelock",
      "Owner can cancel at any point during timelock",
      "Optional arbiter for dispute resolution",
      "Immutable audit trail via on-chain events",
    ],
    detail: "After M-of-N guardian approval, a timelock countdown begins. During this window, the owner (or arbiter) can still cancel. Once the timelock elapses, distribution begins — trustlessly, on-chain, in batches.",
  },
  {
    id: "distribution",
    icon: "💸",
    title: "Batched Distribution",
    tagline: "Gas-safe, compute-safe",
    color: "#14b8a6",
    points: [
      "Pro-rata, fixed BPS, or entire-to-beneficiary modes",
      "SOL and SPL distributed in separate sessions",
      "Cursor-based batching — never hits compute limit",
      "Missing ATAs auto-created during SPL distribution",
    ],
    detail: "Distribution is broken into compute-safe batches. A cursor tracks progress so any batch failure can be retried. The system supports up to 255 beneficiaries (Enterprise tier) without a single transaction blowing compute.",
  },
  {
    id: "documents",
    icon: "📜",
    title: "Document Vault",
    tagline: "Encrypted off-chain documents, anchored on-chain",
    color: "#a78bfa",
    points: [
      "SHA-256 hash of encrypted document stored on-chain",
      "Arweave / S3 URI stored in vault account",
      "Revocable commitment by owner",
      "Indexer tracks full document history",
    ],
    detail: "Store a last will, asset list, or instructions by anchoring a SHA-256 hash on-chain. The encrypted file lives off-chain (Arweave / S3). Beneficiaries and guardians can verify document authenticity without on-chain storage costs.",
  },
  {
    id: "subscription",
    icon: "🎖️",
    title: "Subscription Tiers",
    tagline: "Free → Pro → Enterprise",
    color: "#22c55e",
    points: [
      "Free: 2 guardians, 2 beneficiaries, 1 vault",
      "Pro: 5 guardians, 10 beneficiaries, 3 vaults",
      "Enterprise: 20 guardians, 255 beneficiaries",
      "Subscription state tracked on-chain",
    ],
    detail: "Limits are enforced on-chain, not just in the UI. The GlobalConfig account holds per-tier maximums, and each vault checks its SubscriptionTier against those limits at instruction time.",
  },
  {
    id: "dispute",
    icon: "⚖️",
    title: "Dispute Resolution",
    tagline: "Optional arbiter layer",
    color: "#f97316",
    points: [
      "Any guardian can open a dispute",
      "Arbiter wallet set at vault creation",
      "Dispute blocks distribution progression",
      "Arbiter resolves: cancel or proceed",
    ],
    detail: "For contested estates, an optional arbiter Pubkey can be configured. When a dispute is opened, the UnlockSession transitions to Disputed status, blocking finalize_unlock until the arbiter calls resolve_dispute.",
  },
];

export default function Features() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

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
            "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(124,58,237,0.07) 0%, transparent 60%), #050a14",
        }}
      />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.35 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "3px",
              color: "#7c3aed",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            Capabilities
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
            Core Features
          </h2>
          <p style={{ color: "rgba(226,232,240,0.5)", fontSize: "15px" }}>
            Hover a card to learn more, click to pin
          </p>
        </motion.div>

        {/* Feature grid */}
        <div
          className="features-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {features.map((f, i) => {
            const isActive = hovered === f.id || selected === f.id;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                onMouseEnter={() => setHovered(f.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === f.id ? null : f.id)}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, rgba(${hexToRgb(f.color)},0.18), rgba(10,22,40,0.97))`
                    : "rgba(10,22,40,0.8)",
                  border: `1px solid ${isActive ? f.color + "55" : "rgba(124,58,237,0.12)"}`,
                  borderRadius: "14px",
                  padding: "24px 20px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isActive ? `0 0 30px ${f.color}20` : "none",
                }}
              >
                {/* Glow corner */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: -30,
                      right: -30,
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${f.color}30, transparent 70%)`,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Selected indicator */}
                {selected === f.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: f.color,
                      boxShadow: `0 0 8px ${f.color}`,
                    }}
                  />
                )}

                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: isActive ? f.color : "#e2e8f0",
                    marginBottom: "4px",
                    transition: "color 0.3s",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(226,232,240,0.45)",
                    marginBottom: isActive ? "14px" : 0,
                    transition: "all 0.3s",
                  }}
                >
                  {f.tagline}
                </p>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          color: "rgba(226,232,240,0.7)",
                          lineHeight: 1.65,
                          marginBottom: "12px",
                        }}
                      >
                        {f.detail}
                      </p>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {f.points.map((pt, pi) => (
                          <li
                            key={pi}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              fontSize: "11px",
                              color: "rgba(226,232,240,0.6)",
                              marginBottom: "6px",
                              lineHeight: 1.5,
                            }}
                          >
                            <span style={{ color: f.color, marginTop: "1px", flexShrink: 0 }}>◆</span>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: isActive ? f.color : "transparent",
                    borderRadius: "0 0 14px 14px",
                    transition: "background 0.3s",
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : "124,58,237";
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: 1,
    icon: "🔐",
    title: "Create Your Vault",
    short: "Deploy an on-chain vault",
    detail:
      "Connect your Solana wallet and initialize a PDA-based vault. Set your inactivity threshold (30–365 days) and timelock duration (1–90 days). Your vault authority PDA holds all assets — never a custodian.",
    code: `create_vault(CreateVaultArgs {
  vault_nonce: 0,
  inactivity_threshold: 90 * 24 * 3600,
  timelock_duration:     7 * 24 * 3600,
  guardian_threshold: 2,
})`,
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.3)",
  },
  {
    id: 2,
    icon: "👥",
    title: "Assign Guardians",
    short: "M-of-N consensus layer",
    detail:
      "Invite trusted individuals as Personal, Professional, or Delegate guardians. Set the M-of-N threshold needed to trigger unlock. Professional guardians post on-chain bonds — slashable on misconduct.",
    code: `add_guardian(AddGuardianArgs {
  guardian_wallet: alice_pubkey,
  role: GuardianRole::Personal,
})
// Repeat for each guardian
set_guardian_threshold(ctx, 2); // 2-of-3`,
    color: "#0ea5e9",
    glow: "rgba(14,165,233,0.3)",
  },
  {
    id: 3,
    icon: "💎",
    title: "Define Beneficiaries",
    short: "Programmable distribution",
    detail:
      "Add beneficiary wallets with share allocations in basis points (must total 10,000 = 100%). Set per-asset rules: pro-rata, fixed BPS, or entire-to-beneficiary. Supports SOL + any SPL / Token-2022 token.",
    code: `add_beneficiary(AddBeneficiaryArgs {
  beneficiary_wallet: bob_pubkey,
  share_bps: 6000, // 60%
  active: true,
})
set_asset_rule(SetAssetRuleArgs {
  mint: usdc_mint,
  mode: AssetRuleMode::EntireToBeneficiary,
  fixed_bps: None,
})`,
    color: "#14b8a6",
    glow: "rgba(20,184,166,0.3)",
  },
  {
    id: 4,
    icon: "💤",
    title: "Stay Active",
    short: "Proof-of-life check-in",
    detail:
      "Periodically call check_in() to reset your liveness clock. You can delegate check-ins to a trusted party. If the inactivity window expires, guardians gain the ability to initiate the unlock sequence.",
    code: `// Called by owner or delegate
check_in(ctx)
// Resets last_check_in = Clock::now()
// Vault status remains Active`,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    id: 5,
    icon: "🔓",
    title: "Guardian Unlock",
    short: "Time-locked multi-sig",
    detail:
      "After inactivity threshold: a guardian initiates unlock. M-of-N guardians approve. Timelock starts — owner can still cancel. After timelock elapses, distribution begins automatically in batches.",
    code: `initiate_unlock(ctx)   // guardian
approve_unlock(ctx)    // guardian × M
// Timelock counts down...
// Owner can cancel_unlock() during this window
// After timelock:
init_sol_distribution(ctx)
execute_sol_batch(ctx, { start_index: 0, batch_size: 5 })
finalize_unlock(ctx)`,
    color: "#ec4899",
    glow: "rgba(236,72,153,0.3)",
  },
  {
    id: 6,
    icon: "✅",
    title: "Assets Distributed",
    short: "Trustless execution",
    detail:
      "SOL and SPL tokens are distributed on-chain to beneficiary wallets according to the pre-set rules. Dispute resolution via an optional arbiter account. Vault transitions to Distributed — a terminal state.",
    code: `// Vault.status → Distributed
// All assets transferred
// On-chain event emitted:
AssetsDistributed {
  vault: vault_pubkey,
  total_lamports: 5_000_000_000,
  beneficiary_count: 3,
  timestamp: 1735000000,
}`,
    color: "#22c55e",
    glow: "rgba(34,197,94,0.3)",
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

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
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(20,184,166,0.08) 0%, transparent 70%), #050a14",
        }}
      />
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "3px",
              color: "#14b8a6",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            Workflow
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
            How It Works
          </h2>
          <p style={{ color: "rgba(226,232,240,0.5)", fontSize: "15px" }}>
            Click any step to reveal the on-chain code
          </p>
        </motion.div>

        {/* Steps grid */}
        <div
          className="how-grid-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              style={{
                background:
                  activeStep === step.id
                    ? `linear-gradient(135deg, rgba(${hexToRgb(step.color)},0.15), rgba(10,22,40,0.95))`
                    : "linear-gradient(135deg, rgba(13,31,56,0.9), rgba(10,22,40,0.95))",
                border: `1px solid ${activeStep === step.id ? step.color + "60" : "rgba(124,58,237,0.15)"}`,
                borderRadius: "16px",
                padding: "28px 24px",
                cursor: "pointer",
                transition: "all 0.35s ease",
                position: "relative",
                overflow: "hidden",
              }}
              whileHover={{
                scale: 1.02,
                borderColor: step.color + "50",
              }}
            >
              {/* Step number */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(226,232,240,0.25)",
                  letterSpacing: "1px",
                }}
              >
                0{step.id}
              </div>

              {/* Icon */}
              <div style={{ fontSize: "32px", marginBottom: "14px" }}>{step.icon}</div>

              {/* Title */}
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: activeStep === step.id ? step.color : "#e2e8f0",
                  marginBottom: "6px",
                  transition: "color 0.3s",
                }}
              >
                {step.title}
              </h3>

              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(226,232,240,0.5)",
                  marginBottom: activeStep === step.id ? "16px" : 0,
                }}
              >
                {step.short}
              </p>

              {/* Expanded content */}
              <AnimatePresence>
                {activeStep === step.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        color: "rgba(226,232,240,0.75)",
                        lineHeight: 1.65,
                        marginBottom: "16px",
                      }}
                    >
                      {step.detail}
                    </p>
                    <pre
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px",
                        color: "#a78bfa",
                        background: "rgba(0,0,0,0.4)",
                        border: `1px solid ${step.color}30`,
                        borderRadius: "8px",
                        padding: "14px",
                        overflowX: "auto",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <code>{step.code}</code>
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom indicator */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: activeStep === step.id ? step.color : "transparent",
                  borderRadius: "0 0 16px 16px",
                  transition: "background 0.3s",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Timeline connector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            textAlign: "center",
            marginTop: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0",
          }}
        >
          {steps.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => setActiveStep(activeStep === s.id ? null : s.id)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: s.color,
                  opacity: activeStep === s.id ? 1 : 0.4,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  boxShadow: activeStep === s.id ? `0 0 12px ${s.color}` : "none",
                }}
              />
              {i < steps.length - 1 && (
                <div
                  style={{
                    width: 60,
                    height: 1,
                    background: "linear-gradient(90deg, rgba(124,58,237,0.3), rgba(124,58,237,0.1))",
                  }}
                />
              )}
            </div>
          ))}
        </motion.div>
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

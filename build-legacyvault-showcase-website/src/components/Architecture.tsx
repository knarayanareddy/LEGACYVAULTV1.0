import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const layers = [
  {
    id: "program",
    label: "Anchor Program",
    sublabel: "programs/legacyvault",
    color: "#7c3aed",
    icon: "⚙️",
    modules: [
      { id: "A", name: "Global Admin", desc: "initialize_global_config, pause/unpause — admin multisig controls" },
      { id: "B", name: "Vault Lifecycle", desc: "create_vault, update_settings, freeze/unfreeze — PDA state machine" },
      { id: "C", name: "Guardians", desc: "add/remove/accept guardians — role & status management" },
      { id: "D", name: "Beneficiaries", desc: "add/update/remove + per-asset rules — BPS allocation engine" },
      { id: "E", name: "Assets", desc: "deposit/withdraw SOL & SPL — vault authority PDA holds all funds" },
      { id: "F", name: "Liveness", desc: "check_in, add/remove delegate — inactivity clock reset" },
      { id: "G", name: "Documents", desc: "set/revoke SHA-256 hash + Arweave URI — encrypted doc commitment" },
      { id: "H", name: "Unlock", desc: "initiate → approve → cancel/dispute — multi-party time-locked" },
      { id: "I", name: "Distribution", desc: "init_sol/spl_distribution → batch execute → finalize — cursor-based" },
      { id: "J", name: "Subscriptions", desc: "set_subscription → fee transfer → tier enforcement on-chain" },
      { id: "K", name: "Pro Guardians", desc: "register → KYC → bond → slash — professional guardian registry" },
    ],
  },
  {
    id: "indexer",
    label: "Event Indexer",
    sublabel: "indexer/",
    color: "#0ea5e9",
    icon: "📡",
    modules: [
      { id: "I1", name: "Geyser Plugin", desc: "Streams all program events from Solana validator via gRPC" },
      { id: "I2", name: "Event Parser", desc: "Decodes 38 on-chain event types into structured DB rows" },
      { id: "I3", name: "PostgreSQL", desc: "Persists vault state, history, guardian actions, distributions" },
      { id: "I4", name: "WebSocket Push", desc: "Pushes real-time vault updates to connected dashboard clients" },
    ],
  },
  {
    id: "api",
    label: "REST API",
    sublabel: "api/",
    color: "#14b8a6",
    icon: "🌐",
    modules: [
      { id: "A1", name: "/vault/:pubkey", desc: "Full vault state including guardian list, beneficiaries, asset rules" },
      { id: "A2", name: "/vault/:pubkey/history", desc: "All historical events for a vault, paginated" },
      { id: "A3", name: "/guardian/:wallet", desc: "All vaults a guardian wallet is associated with" },
      { id: "A4", name: "/unlock/:session", desc: "Current unlock session status and approvals" },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    sublabel: "dashboard/",
    color: "#f59e0b",
    icon: "🖥️",
    modules: [
      { id: "D1", name: "Wallet Connect", desc: "Phantom / Solflare / Backpack — @solana/wallet-adapter" },
      { id: "D2", name: "Vault Overview", desc: "Status, assets, check-in timer, subscription tier" },
      { id: "D3", name: "Guardian Panel", desc: "Invite, accept, remove — live M-of-N threshold display" },
      { id: "D4", name: "Distribution Wizard", desc: "Set beneficiaries, allocate BPS, set per-asset rules" },
    ],
  },
];

const accounts = [
  { name: "GlobalConfig", seeds: "[b\"global_config\"]", size: "104B", color: "#7c3aed" },
  { name: "Vault", seeds: "[b\"vault\", owner, nonce]", size: "558B", color: "#a78bfa" },
  { name: "GuardianEntry", seeds: "[b\"guardian\", vault, wallet]", size: "117B", color: "#0ea5e9" },
  { name: "BeneficiaryEntry", seeds: "[b\"beneficiary\", vault, wallet]", size: "108B", color: "#14b8a6" },
  { name: "AssetRule", seeds: "[b\"asset_rule\", vault, beneficiary, mint]", size: "117B", color: "#f59e0b" },
  { name: "UnlockSession", seeds: "[b\"unlock_session\", vault, count]", size: "144B", color: "#ec4899" },
  { name: "GuardianApproval", seeds: "[b\"approval\", session, guardian]", size: "81B", color: "#22c55e" },
  { name: "SolDistSession", seeds: "[b\"sol_dist\", session]", size: "116B", color: "#f97316" },
  { name: "SplDistSession", seeds: "[b\"spl_dist\", session, mint]", size: "149B", color: "#8b5cf6" },
  { name: "DisputeCase", seeds: "[b\"dispute\", session]", size: "237B", color: "#ef4444" },
  { name: "SubscriptionState", seeds: "[b\"subscription\", vault]", size: "99B", color: "#06b6d4" },
  { name: "ProGuardianProfile", seeds: "[b\"pro_guardian\", wallet]", size: "403B", color: "#d946ef" },
];

export default function Architecture() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null);

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
            "radial-gradient(ellipse 60% 50% at 80% 30%, rgba(14,165,233,0.07) 0%, transparent 60%), #050a14",
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
              color: "#0ea5e9",
              marginBottom: "12px",
            }}
          >
            SYSTEM DESIGN
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
            Architecture
          </h2>
          <p style={{ color: "rgba(226,232,240,0.5)", fontSize: "15px" }}>
            Click a layer to explore its modules
          </p>
        </motion.div>

        {/* Layer cards */}
        <div
          className="arch-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {layers.map((layer, i) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
              style={{
                background:
                  activeLayer === layer.id
                    ? `linear-gradient(135deg, rgba(${hexToRgb(layer.color)},0.18), rgba(10,22,40,0.97))`
                    : "rgba(10,22,40,0.85)",
                border: `1px solid ${activeLayer === layer.id ? layer.color + "55" : "rgba(124,58,237,0.12)"}`,
                borderRadius: "16px",
                padding: "24px 20px",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: activeLayer === layer.id ? `0 0 40px ${layer.color}18` : "none",
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{layer.icon}</div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: layer.color,
                  marginBottom: "4px",
                  letterSpacing: "0.5px",
                }}
              >
                {layer.sublabel}
              </div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: activeLayer === layer.id ? layer.color : "#e2e8f0",
                  marginBottom: "8px",
                  transition: "color 0.3s",
                }}
              >
                {layer.label}
              </h3>
              <div style={{ fontSize: "12px", color: "rgba(226,232,240,0.4)" }}>
                {layer.modules.length} modules
              </div>
              <div
                style={{
                  position: "relative",
                  marginTop: "14px",
                  height: "2px",
                  background: "rgba(226,232,240,0.06)",
                  borderRadius: "1px",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{
                    width: activeLayer === layer.id ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.4 }}
                  style={{
                    height: "100%",
                    background: layer.color,
                    borderRadius: "1px",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Module expansion */}
        <AnimatePresence>
          {activeLayer && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                overflow: "hidden",
                marginBottom: "48px",
              }}
            >
              {(() => {
                const layer = layers.find((l) => l.id === activeLayer)!;
                return (
                  <div
                    style={{
                      background: `linear-gradient(135deg, rgba(${hexToRgb(layer.color)},0.07), rgba(10,22,40,0.97))`,
                      border: `1px solid ${layer.color}30`,
                      borderRadius: "16px",
                      padding: "32px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "24px",
                      }}
                    >
                      <span style={{ fontSize: "22px" }}>{layer.icon}</span>
                      <div>
                        <h3 style={{ color: layer.color, fontWeight: 700, fontSize: "18px" }}>
                          {layer.label}
                        </h3>
                        <code
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "12px",
                            color: "rgba(226,232,240,0.4)",
                          }}
                        >
                          {layer.sublabel}
                        </code>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      {layer.modules.map((mod, mi) => (
                        <motion.div
                          key={mod.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: mi * 0.04 }}
                          style={{
                            background: "rgba(5,10,20,0.8)",
                            border: `1px solid ${layer.color}20`,
                            borderRadius: "10px",
                            padding: "14px 16px",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              color: layer.color,
                              marginBottom: "4px",
                              letterSpacing: "1px",
                            }}
                          >
                            Module {mod.id}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#e2e8f0",
                              marginBottom: "6px",
                            }}
                          >
                            {mod.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "rgba(226,232,240,0.5)",
                              lineHeight: 1.5,
                            }}
                          >
                            {mod.desc}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDA Accounts section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setShowAccounts(!showAccounts)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(10,22,40,0.85)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "12px",
              padding: "18px 24px",
              cursor: "pointer",
              width: "100%",
              marginBottom: showAccounts ? "20px" : 0,
              transition: "all 0.3s",
              color: "#e2e8f0",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#7c3aed",
                letterSpacing: "2px",
              }}
            >
              PDA ACCOUNTS
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              12 On-Chain Account Structures
            </span>
            <span
              style={{
                marginLeft: "auto",
                color: "#7c3aed",
                transition: "transform 0.3s",
                transform: showAccounts ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showAccounts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "10px",
                  }}
                >
                  {accounts.map((acc, i) => (
                    <motion.div
                      key={acc.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onMouseEnter={() => setHoveredAccount(acc.name)}
                      onMouseLeave={() => setHoveredAccount(null)}
                      style={{
                        background:
                          hoveredAccount === acc.name
                            ? `rgba(${hexToRgb(acc.color)},0.12)`
                            : "rgba(10,22,40,0.8)",
                        border: `1px solid ${hoveredAccount === acc.name ? acc.color + "50" : "rgba(124,58,237,0.1)"}`,
                        borderRadius: "10px",
                        padding: "14px",
                        transition: "all 0.25s",
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: hoveredAccount === acc.name ? acc.color : "#e2e8f0",
                          marginBottom: "6px",
                          transition: "color 0.25s",
                        }}
                      >
                        {acc.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: "rgba(226,232,240,0.35)",
                          marginBottom: "6px",
                          wordBreak: "break-all",
                        }}
                      >
                        {acc.seeds}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          color: acc.color,
                        }}
                      >
                        {acc.size}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

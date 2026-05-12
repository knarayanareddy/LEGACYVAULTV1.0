import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Section } from "../App";

interface Props {
  onNav: (s: Section) => void;
}

const stats = [
  { label: "On-Chain Program", value: "Anchor", sub: "Solana Native" },
  { label: "Inactivity Window", value: "30–365d", sub: "Configurable" },
  { label: "Timelock Period", value: "1–90d", sub: "Guardian Delay" },
  { label: "Guardian Model", value: "M-of-N", sub: "Multi-Party" },
];

export default function HeroSection({ onNav }: Props) {
  const [typedText, setTypedText] = useState("");
  const fullText = "digital estate executor";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(interval);
    }, 55);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "80px",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(20,184,166,0.1) 0%, transparent 60%), #050a14",
        }}
      />
      {/* Grid */}
      <div
        className="grid-bg"
        style={{ position: "absolute", inset: 0, opacity: 0.6 }}
      />

      {/* Ambient orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "8%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "8%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.1), transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "pulse-glow 5s ease-in-out infinite reverse",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 860,
          padding: "0 24px",
        }}
      >
        {/* Hackathon badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "32px",
            fontSize: "12px",
            letterSpacing: "1px",
            fontWeight: 600,
            color: "#a78bfa",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#14b8a6",
              display: "inline-block",
              boxShadow: "0 0 8px #14b8a6",
              animation: "pulse-glow 1.5s ease-in-out infinite",
            }}
          />
          COLOSSEUM FRONTIER HACKATHON 2025
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            fontSize: "clamp(42px, 7vw, 82px)",
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: "16px",
            letterSpacing: "-1.5px",
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #14b8a6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Legacy
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Vault
          </span>
        </motion.h1>

        {/* Typewriter subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(13px, 2vw, 17px)",
            color: "rgba(167,139,250,0.8)",
            marginBottom: "20px",
            letterSpacing: "1px",
          }}
        >
          &gt; Solana-native{" "}
          <span style={{ color: "#14b8a6" }}>{typedText}</span>
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "1em",
              background: "#14b8a6",
              marginLeft: 2,
              verticalAlign: "middle",
              animation: "pulse-glow 0.8s step-end infinite",
            }}
          />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "rgba(226,232,240,0.6)",
            maxWidth: 620,
            margin: "0 auto 40px",
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          Programmable inheritance for your Solana assets — secured by on-chain
          vaults, M-of-N guardian consensus, and time-delayed unlocks.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "72px" }}
        >
          <button className="btn-primary" onClick={() => onNav("how")}>
            See How It Works →
          </button>
          <button className="btn-ghost" onClick={() => onNav("features")}>
            Explore Features
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.15)",
            borderRadius: "16px",
            overflow: "hidden",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              style={{
                background: "rgba(10,22,40,0.9)",
                padding: "24px 16px",
                textAlign: "center",
                cursor: "default",
                transition: "background 0.3s",
              }}
              whileHover={{
                background: "rgba(124,58,237,0.12)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(16px, 2.5vw, 22px)",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #a78bfa, #14b8a6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "4px",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.5)", letterSpacing: "0.5px" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(20,184,166,0.6)", marginTop: "2px" }}>
                {s.sub}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Animated vault graphic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{
          position: "absolute",
          right: "5%",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.35,
          pointerEvents: "none",
          display: "none",
        }}
      >
        <VaultGraphic />
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          color: "rgba(167,139,250,0.4)",
          fontSize: "11px",
          letterSpacing: "1px",
          cursor: "pointer",
        }}
        onClick={() => onNav("how")}
      >
        <span>EXPLORE</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontSize: "16px" }}
        >
          ↓
        </motion.div>
      </motion.div>
    </div>
  );
}

function VaultGraphic() {
  return (
    <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
      {/* Outer ring */}
      <circle cx="160" cy="160" r="155" stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="8 6" />
      {/* Middle ring */}
      <circle cx="160" cy="160" r="110" stroke="rgba(20,184,166,0.3)" strokeWidth="1" />
      {/* Inner ring */}
      <circle cx="160" cy="160" r="65" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" />
      {/* Center vault */}
      <rect x="130" y="130" width="60" height="60" rx="8" fill="rgba(124,58,237,0.15)" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5" />
      <circle cx="160" cy="160" r="18" stroke="rgba(20,184,166,0.8)" strokeWidth="1.5" fill="none" />
      <circle cx="160" cy="160" r="6" fill="rgba(20,184,166,0.8)" />
      {/* Spoke lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 160 + 65 * Math.cos(rad);
        const y1 = 160 + 65 * Math.sin(rad);
        const x2 = 160 + 110 * Math.cos(rad);
        const y2 = 160 + 110 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
        );
      })}
      {/* Node dots on outer ring */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 160 + 155 * Math.cos(rad);
        const y = 160 + 155 * Math.sin(rad);
        return <circle key={i} cx={x} cy={y} r="4" fill="rgba(124,58,237,0.6)" />;
      })}
    </svg>
  );
}

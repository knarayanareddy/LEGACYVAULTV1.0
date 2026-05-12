import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "./components/HeroSection";
import NavBar from "./components/NavBar";
import HowItWorks from "./components/HowItWorks";
import Architecture from "./components/Architecture";
import Features from "./components/Features";
import TechStack from "./components/TechStack";
import Footer from "./components/Footer";
import ParticleField from "./components/ParticleField";

export type Section = "hero" | "how" | "features" | "architecture" | "tech";

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>("hero");

  const handleNav = (section: Section) => {
    setActiveSection(section);
  };

  return (
    <div className="app-root" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <ParticleField />
      <NavBar active={activeSection} onNav={handleNav} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ minHeight: "100vh" }}
        >
          {activeSection === "hero" && <HeroSection onNav={handleNav} />}
          {activeSection === "how" && <HowItWorks />}
          {activeSection === "features" && <Features />}
          {activeSection === "architecture" && <Architecture />}
          {activeSection === "tech" && <TechStack />}
        </motion.div>
      </AnimatePresence>
      <Footer onNav={handleNav} />
    </div>
  );
}

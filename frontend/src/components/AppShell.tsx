"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { CommandPalette } from "@/components/CommandPalette";
import GradientWaves from "@/components/GradientWaves";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-zinc-700 selection:text-white flex flex-col font-sans overflow-x-hidden">
      {/* Full-Screen Ambient 3D Gradient Waves Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <GradientWaves
          horizonColor="#4338ca"
          waveColor="#86198f"
          crestColor="#38bdf8"
          speed={0.3}
          amplitude={2.2}
          waveScale={0.85}
          waveRatio={0.95}
          swell={30}
          turbulence={18}
          tilt={1.11}
          zoom={1.0}
          height={5.0}
          fogDepth={17}
          detail="medium"
          brightness={1.05}
          opacity={0.85}
          mouseInteraction={true}
          parallaxStrength={0.45}
          grain={true}
          grainIntensity={0.03}
          className="w-full h-full"
        />
        {/* Balanced vignette overlay for sleek dark-mode readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/60 via-[#09090b]/45 to-[#09090b]/70 backdrop-blur-[1px] pointer-events-none" />
      </div>

      {/* Main Foreground Interface */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="border-t border-zinc-800/60 bg-[#09090b]/70 backdrop-blur-md py-6 text-center text-xs text-zinc-400 font-mono">
          <p>EKIS • Engineering Knowledge Intelligence System • Hybrid RAG Engine</p>
        </footer>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}

"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

const Particle = ({ delay }: { delay: number }) => {
  const randomX = useMemo(() => Math.random() * 100, []);
  const randomY = useMemo(() => Math.random() * 100, []);
  const randomDuration = useMemo(() => 15 + Math.random() * 15, []);
  
  return (
    <motion.div
      className="absolute w-1 h-1 bg-blue-500/20 rounded-full"
      style={{ left: `${randomX}%`, top: `${randomY}%` }}
      animate={{
        y: [0, -100, 0],
        x: [0, 50, 0],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration: randomDuration,
        repeat: Infinity,
        delay: delay,
        ease: "linear",
      }}
    />
  );
};

export default function AmbientEffects() {
  const [mounted, setMounted] = useState(false);
  const particles = useMemo(() => Array.from({ length: 15 }), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Drifting Light 1 */}
      <motion.div
        className="absolute w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px]"
        animate={{
          x: [-200, 200, -200],
          y: [-100, 100, -100],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ left: "10%", top: "10%" }}
      />

      {/* Drifting Light 2 */}
      <motion.div
        className="absolute w-[600px] h-[600px] bg-orange-50/40 rounded-full blur-[100px]"
        animate={{
          x: [200, -200, 200],
          y: [100, -100, 100],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ right: "5%", bottom: "5%" }}
      />

      {/* Particles */}
      {particles.map((_, i) => (
        <Particle key={i} delay={i * 2} />
      ))}
    </div>
  );
}

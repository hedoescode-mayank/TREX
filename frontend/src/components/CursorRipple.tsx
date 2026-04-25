"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function CursorRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const addRipple = useCallback((x: number, y: number) => {
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1000);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      addRipple(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [addRipple]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Mouse Glow */}
      <motion.div
        className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-[90px]"
        animate={{
          x: mousePos.x - 160,
          y: mousePos.y - 160,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 250, mass: 0.3 }}
      />

      {/* Pulse when stationary could be added here, but let's stick to clicks for now */}
      
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              left: ripple.x,
              top: ripple.y,
              position: "absolute",
              width: "40px",
              height: "40px",
              marginLeft: "-20px",
              marginTop: "-20px",
              borderRadius: "50%",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";
import React, { useEffect, useRef } from "react";

export default function HexGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Direct script injection to handle the CDN import safely in Next.js
    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
      import Grid1Background from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.16/build/backgrounds/grid1.cdn.min.js';
      
      const canvas = document.getElementById('webgl-canvas');
      if (canvas) {
        const bg = Grid1Background(canvas);
        
        // Custom branding colors: Very light grays and whites for "white space" feel
        bg.grid.setColors([0xf8f9fa, 0xe5e7eb, 0xdbeafe]);
        bg.grid.light1.color.set(0xffffff);
        bg.grid.light2.color.set(0x3b82f6);
        
        // Optional: Expose bg for global color changing if needed
        window.hexBg = bg;
      }
    `;
    document.body.appendChild(script);

    return () => {
      // Clean up script if necessary, though the canvas will be unmounted
      document.body.removeChild(script);
      const canvasElement = document.getElementById('webgl-canvas');
      if (canvasElement) canvasElement.innerHTML = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-white">
      <canvas id="webgl-canvas" ref={canvasRef} className="w-full h-full block" />
      {/* Readability Overlay: Ensures text is always visible regardless of the 3D grid lighting */}
      <div className="absolute inset-0 bg-white/60 pointer-events-none" />
    </div>
  );
}

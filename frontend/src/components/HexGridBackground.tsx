"use client";
import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    hexBg: any;
  }
}

export default function HexGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.active = 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Direct script injection with THREE for light theme customization
    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
      import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
      import Grid1Background from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.16/build/backgrounds/grid1.cdn.min.js';
      
      const canvas = document.getElementById('webgl-canvas');
      if (canvas && !window.hexBg) {
        const bg = Grid1Background(canvas);
        
        // 1. Force light theme background
        bg.three.renderer.setClearColor(0xffffff, 1);
        bg.three.scene.background = new THREE.Color(0xffffff);
        
        // 2. Add Ambient Light to prevent dark 'dark mode' shadows
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        bg.three.scene.add(ambient);
        
        // 3. Set grid colors to dark grays for visible boundaries
        bg.grid.setColors([0xe2e8f0, 0x94a3b8, 0x475569]);
        
        // 4. Configure lights for depth and interactivity
        bg.grid.light1.color.set(0x3b82f6);
        bg.grid.light1.intensity = 1500;
        bg.grid.config.depthScale = 5.0; // High responsiveness
        
        window.hexBg = bg;
      }
    `;
    document.body.appendChild(script);

    // Animation loop for pulsing and reactive effect
    let time = 0;
    const animate = () => {
      if (window.hexBg) {
        time += 0.005;
        const pulse = (Math.sin(time) + 1) / 2;
        
        const boost = mouseRef.current.active * 2.0; 
        const targetInt1 = 1500 + pulse * 500 + boost * 1000;

        window.hexBg.grid.light1.intensity += (targetInt1 - window.hexBg.grid.light1.intensity) * 0.1;
        
        mouseRef.current.active *= 0.98;
        if (mouseRef.current.active < 0.01) mouseRef.current.active = 0;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    const timeoutId = setTimeout(animate, 500);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
      if (window.hexBg) {
        window.hexBg = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-white">
      <canvas 
        id="webgl-canvas" 
        ref={canvasRef} 
        className="w-full h-full block" 
      />
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />
    </div>
  );
}

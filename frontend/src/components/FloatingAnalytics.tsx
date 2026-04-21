"use client";
import React from "react";
import { motion } from "framer-motion";

export default function FloatingAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 1 }}
      className="absolute right-[5%] top-[40%] hidden lg:block"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="glass rounded-3xl p-6 shadow-2xl border border-white/40 max-w-[240px] backdrop-blur-xl bg-white/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">System Active</span>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Resume Match</p>
            <p className="text-2xl font-bold text-black">87<span className="text-blue-500">%</span></p>
          </div>
          
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Context Engine</p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "92%" }}
                transition={{ duration: 2, delay: 1.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100/50">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Best City Fit</p>
            <p className="text-sm font-semibold text-gray-800">Bangalore (Top 1%)</p>
          </div>
        </div>
        
        {/* Subtle scanline effect on the card */}
        <motion.div 
          animate={{ top: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-blue-400/5 to-transparent pointer-events-none"
        />
      </motion.div>
    </motion.div>
  );
}

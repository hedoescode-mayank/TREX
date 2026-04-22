"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden border border-black/10 shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Aarav Sharma"
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@email.com"
                className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all disabled:opacity-50"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Start Experience"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-black/10 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.1-.9 2.1-1.9 2.8v2.3h3.1c1.8-1.7 2.8-4.1 2.8-6.9z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 5-1 6.6-2.6l-3.1-2.3c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H1.1v2.5C2.7 17.5 6.1 20 10 20z" fill="#34A853"/>
              <path d="M4.2 11.7c-.2-.6-.3-1.2-.3-1.7s.1-1.1.3-1.7V5.8H1.1C.4 7.1 0 8.5 0 10s.4 2.9 1.1 4.2l3.1-2.5z" fill="#FBBC05"/>
              <path d="M10 3.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 1 12.7 0 10 0 6.1 0 2.7 2.5 1.1 5.8l3.1 2.5c.8-2.5 3.1-4.5 5.8-4.5z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-sm text-gray-500">
            {isLogin ? "New to T.R.E.X?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-600 font-bold hover:underline"
            >
              {isLogin ? "Create Account" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

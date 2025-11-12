"use client";
import { motion } from "framer-motion";
import React from "react";
import { TermsNotice } from "@/components/common/TermsNotice";
import { signIn } from "next-auth/react";

interface EmailStepProps {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const EmailStep: React.FC<EmailStepProps> = (formData) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await signIn("loops", {
      email: formData.email,
      redirect: false,
    });
    if (response?.ok) formData.onSubmit();
  };
  const handleGoogleSignIn = () => {
    signIn("google", {
      redirectTo: "/",
    });
  };

  return (
    <motion.div
      key="email-step"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <div className="space-y-1">
        <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
          Welcome To Pixel Mint
        </h1>
        <p className="text-[1.8rem] text-white/70 font-light">
          Your nft marketplace
        </p>
      </div>
      <div className="space-y-4">
        <button
          className="backdrop-blur-[2px] w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors cursor-pointer"
          onClick={handleGoogleSignIn}
        >
          <span className="text-lg">G</span>
          <span>Sign in with Google</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-white/40 text-sm">or</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="email"
              placeholder="info@gmail.com"
              value={formData.email}
              onChange={(e) => formData.onChange(e.target.value)}
              className="w-full backdrop-blur-[1px] text-white border-1 border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border focus:border-white/30 text-center"
              required
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 text-white w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors group overflow-hidden"
            >
              <span className="relative w-full h-full block overflow-hidden">
                <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-full">
                  →
                </span>
                <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 -translate-x-full group-hover:translate-x-0">
                  →
                </span>
              </span>
            </button>
          </div>
        </form>
      </div>
      <TermsNotice className="pt-10" />
    </motion.div>
  );
};

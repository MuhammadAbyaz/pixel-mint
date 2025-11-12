"use client";
import { motion } from "framer-motion";
import React from "react";
import { useRouter } from 'next/navigation';

export const SuccessStep: React.FC = () => {
  const router = useRouter();
  const handleRedirection = ()=>{
    router.push("/")
  }
  return(
  <motion.div
    key="success-step"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
    className="space-y-6 text-center"
  >
    <div className="space-y-1">
      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
        You&apos;re in!
      </h1>
      <p className="text-[1.25rem] text-white/50 font-light">Welcome</p>
    </div>
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="py-10"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-black"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </motion.div>
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors"
      onClick={handleRedirection}
    >
      Continue to Dashboard
    </motion.button>
  </motion.div>
)};

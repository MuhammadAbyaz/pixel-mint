"use client";
import { motion } from "framer-motion";
import React from "react";
import { TermsNotice } from "@/components/common/TermsNotice";

interface CodeStepProps {
  code: string[];
  onCodeChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  codeInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onBack: () => void;
}

export const CodeStep: React.FC<CodeStepProps> = ({
  code,
  onCodeChange,
  onKeyDown,
  codeInputRefs,
  onBack,
}) => {
  return (
    <motion.div
      key="code-step"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-foreground">
          We sent you a code
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground font-normal">
          Please enter it
        </p>
      </div>
      <div className="w-full">
        <div className="relative rounded-full py-4 px-5 border border-border bg-card/50">
          <div className="flex items-center justify-center">
            {code.map((digit, i) => (
              <div key={i} className="flex items-center">
                <div className="relative">
                  <input
                    ref={(el) => {
                      codeInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => onCodeChange(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    className="w-8 text-center text-lg bg-transparent text-foreground border-none focus:outline-none focus:ring-0 appearance-none"
                    style={{ caretColor: "transparent" }}
                  />
                  {!digit && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                      <span className="text-lg text-muted-foreground">0</span>
                    </div>
                  )}
                </div>
                {i < 5 && <span className="text-border text-lg">|</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <motion.p
          className="text-muted-foreground hover:text-foreground/70 transition-colors cursor-pointer text-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          Resend code
        </motion.p>
      </div>
      <div className="flex w-full gap-3">
        <motion.button
          onClick={onBack}
          className="rounded-lg bg-primary text-primary-foreground font-medium px-6 py-2.5 hover:bg-primary/90 transition-all w-[30%] text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          Back
        </motion.button>
        <motion.button
          className={`flex-1 rounded-lg font-medium py-2.5 border transition-all duration-300 text-sm ${code.every((d) => d !== "") ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/90 cursor-pointer" : "bg-card text-muted-foreground border-border cursor-not-allowed"}`}
          disabled={!code.every((d) => d !== "")}
        >
          Continue
        </motion.button>
      </div>
      <div className="pt-16">
        <TermsNotice />
      </div>
    </motion.div>
  );
};

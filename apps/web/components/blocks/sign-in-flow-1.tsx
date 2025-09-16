"use client";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CanvasRevealEffect } from "@/components/reveal/canvas-reveal";
import { EmailStep } from "@/components/auth/EmailStep";
import { CodeStep } from "@/components/auth/CodeStep";
import { SuccessStep } from "@/components/auth/SuccessStep";
import { toast } from "sonner";
import { STEPS } from "@/constants/steps";
import { useSession } from "next-auth/react";

interface SignInPageProps {
  className?: string;
}

export const SignInPage = ({ className }: SignInPageProps) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<(typeof STEPS)[keyof typeof STEPS]>(
    STEPS.EMAIL,
  );
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const { update } = useSession();

  const goToCodeStep = () => {
    if (email) setStep(STEPS.CODE);
  };

  useEffect(() => {
    if (step === STEPS.CODE) {
      const t = setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleCodeChange = async (index: number, value: string) => {
    const callbackUrl = "http://localhost:3000";
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
      if (index === 5 && value) {
        const isComplete = newCode.every((d) => d.length === 1);
        if (isComplete) {
          setReverseCanvasVisible(true);
          const res = await fetch(
            `/api/auth/callback/loops?email=${encodeURIComponent(
              email,
            )}&token=${newCode.join("")}${callbackUrl ? `&callbackUrl=${callbackUrl}` : ""}`,
          );
          if (res?.ok && res.url.includes("error")) {
            toast.error("Invalid or expired OTP, please try again.");
            setCode(["", "", "", "", "", ""]);
            setReverseCanvasVisible(false);
            setInitialCanvasVisible(true);
            codeInputRefs.current[0]?.focus();
            return;
          } else if (res?.ok) {
            setStep(STEPS.SUCCESS);
            setInitialCanvasVisible(false);
            await update();
          }
        }
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0)
      codeInputRefs.current[index - 1]?.focus();
  };

  const handleBackClick = () => {
    setStep(STEPS.EMAIL);
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col min-h-screen bg-black relative",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full mt-[150px] max-w-sm">
              <AnimatePresence mode="wait">
                {step === STEPS.EMAIL && (
                  <EmailStep
                    email={email}
                    onChange={setEmail}
                    onSubmit={goToCodeStep}
                  />
                )}
                {step === STEPS.CODE && (
                  <CodeStep
                    code={code}
                    onCodeChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    codeInputRefs={codeInputRefs}
                    onBack={handleBackClick}
                  />
                )}
                {step === STEPS.SUCCESS && <SuccessStep />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

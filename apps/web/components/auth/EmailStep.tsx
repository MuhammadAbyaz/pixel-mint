"use client";
import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TermsNotice } from "@/components/common/TermsNotice";
import { signIn } from "next-auth/react";

interface EmailStepProps {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export const EmailStep: React.FC<EmailStepProps> = ({
  email,
  onChange,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || "",
    },
  });

  // Sync parent email prop with form when it changes
  useEffect(() => {
    if (email) {
      setValue("email", email);
    }
  }, [email, setValue]);

  const onFormSubmit = async (data: EmailFormData) => {
    const response = await signIn("loops", {
      email: data.email,
      redirect: false,
    });
    if (response?.ok) onSubmit();
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
        <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-foreground">
          Welcome To Pixel Mint
        </h1>
        <p className="text-lg sm:text-xl text-foreground/70 font-normal">
          Your nft marketplace
        </p>
      </div>
      <div className="space-y-4">
        <button
          className="backdrop-blur-[2px] w-full flex items-center justify-center gap-2 bg-primary/5 hover:bg-primary/10 text-foreground border border-border rounded-lg py-2.5 px-4 transition-all cursor-pointer text-sm font-medium"
          onClick={handleGoogleSignIn}
        >
          <span className="text-base">G</span>
          <span>Sign in with Google</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="h-px bg-border flex-1" />
          <span className="text-muted-foreground text-sm">or</span>
          <div className="h-px bg-border flex-1" />
        </div>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="relative">
            <input
              {...register("email", {
                onChange: (e) => onChange(e.target.value),
              })}
              type="email"
              placeholder="info@gmail.com"
              className={`w-full backdrop-blur-[1px] text-foreground border-1 rounded-lg py-2.5 px-4 focus:outline-none focus:border focus:border-primary/50 text-center bg-card/50 text-sm ${
                errors.email ? "border-destructive" : "border-border"
              }`}
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">
                {errors.email.message}
              </p>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 text-foreground w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-all group overflow-hidden"
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

import Link from "next/link";
import React from "react";

export const TermsNotice = ({ className = "" }: { className?: string }) => (
  <p className={`text-xs text-white/40 ${className}`}>
    By signing up, you agree to the{" "}
    <Link
      href="#"
      className="underline text-white/40 hover:text-white/60 transition-colors"
    >
      MSA
    </Link>
    ,{" "}
    <Link
      href="#"
      className="underline text-white/40 hover:text-white/60 transition-colors"
    >
      Product Terms
    </Link>
    ,{" "}
    <Link
      href="#"
      className="underline text-white/40 hover:text-white/60 transition-colors"
    >
      Policies
    </Link>
    ,{" "}
    <Link
      href="#"
      className="underline text-white/40 hover:text-white/60 transition-colors"
    >
      Privacy Notice
    </Link>
    , and{" "}
    <Link
      href="#"
      className="underline text-white/40 hover:text-white/60 transition-colors"
    >
      Cookie Notice
    </Link>
    .
  </p>
);

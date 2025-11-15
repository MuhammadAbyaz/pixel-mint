import Link from "next/link";
import React from "react";

export const TermsNotice = ({ className = "" }: { className?: string }) => (
  <p className={`text-xs text-muted-foreground ${className}`}>
    By signing up, you agree to the{" "}
    <Link
      href="#"
      className="underline text-muted-foreground hover:text-foreground transition-colors"
    >
      MSA
    </Link>
    ,{" "}
    <Link
      href="#"
      className="underline text-muted-foreground hover:text-foreground transition-colors"
    >
      Product Terms
    </Link>
    ,{" "}
    <Link
      href="#"
      className="underline text-muted-foreground hover:text-foreground transition-colors"
    >
      Policies
    </Link>
    ,{" "}
    <Link
      href="#"
      className="underline text-muted-foreground hover:text-foreground transition-colors"
    >
      Privacy Notice
    </Link>
    , and{" "}
    <Link
      href="#"
      className="underline text-muted-foreground hover:text-foreground transition-colors"
    >
      Cookie Notice
    </Link>
    .
  </p>
);

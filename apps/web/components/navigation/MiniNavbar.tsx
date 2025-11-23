"use client";
import React, { useEffect, useRef, useState } from "react";
import { AnimatedNavLink } from "./AnimatedNavLink";
import { signOut, useSession } from "next-auth/react";
import UserDropdown from "../ui/user-dropdown";
import { ThemeToggle } from "../theme/theme-toggle";

export function MiniNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState("rounded-full");
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    if (isOpen) {
      setHeaderShapeClass("rounded-xl");
    } else {
      shapeTimeoutRef.current = setTimeout(
        () => setHeaderShapeClass("rounded-full"),
        300,
      );
    }
    return () => {
      if (shapeTimeoutRef.current) clearTimeout(shapeTimeoutRef.current);
    };
  }, [isOpen]);

  const logoElement = (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground/60 top-0 left-1/2 transform -translate-x-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground/60 left-0 top-1/2 transform -translate-y-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground/60 right-0 top-1/2 transform -translate-y-1/2 opacity-80" />
      <span className="absolute w-1.5 h-1.5 rounded-full bg-foreground/60 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80" />
    </div>
  );

  const navLinksData = [
    { label: "MarketPlace", href: "/" },
    { label: "Careers", href: "#2" },
    { label: "Discover", href: "#3" },
  ];

  const user = session?.user;
  const initials = (user?.name || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const loginButtonElement = !user && (
    <button
      onClick={() => (window.location.href = "/auth/login")}
      className="px-4 py-2 sm:px-3 text-xs sm:text-sm border border-border bg-card/60 text-muted-foreground rounded-full hover:border-foreground/50 hover:text-foreground hover:bg-card/80 transition-all duration-200 w-full sm:w-auto cursor-pointer"
    >
      Login
    </button>
  );

  const signupButtonElement = !user && (
    <div className="relative group w-full sm:w-auto">
      <div className="absolute inset-0 -m-2 rounded-full hidden sm:block bg-primary/40 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3" />
      <button
        onClick={() => (window.location.href = "/auth/login")}
        className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all duration-200 w-full sm:w-auto cursor-pointer"
      >
        Sign Up
      </button>
    </div>
  );

  const profileButton = user && Object.keys(user).length > 0 && (
    <UserDropdown user={{ ...user, initials }} />
  );

  return (
    <header
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center pl-6 pr-6 py-3 backdrop-blur-sm ${headerShapeClass} border border-border bg-card/60 w-[calc(100%-2rem)] sm:w-auto transition-[border-radius] duration-0 ease-in-out`}
    >
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">{logoElement}</div>
        <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 relative">
          <ThemeToggle />
          {loginButtonElement}
          {signupButtonElement}
          {profileButton}
        </div>
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 text-muted-foreground focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          {isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>
      <div
        className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden ${isOpen ? "max-h-[1000px] opacity-100 pt-4" : "max-h-0 opacity-0 pt-0 pointer-events-none"}`}
      >
        {user ? (
          <div className="flex flex-col items-center space-y-4 w-full">
            <nav className="flex flex-col items-center space-y-4 text-base w-full">
              {navLinksData.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center justify-center w-full">
              <ThemeToggle />
            </div>
            {user.id && (
              <a
                href={`/profile/${user.id}`}
                className="w-full text-center px-4 py-2.5 rounded-lg bg-primary/10 text-primary-foreground hover:bg-primary/20 transition-all text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </a>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ redirectTo: "/" });
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-card transition-all text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <nav className="flex flex-col items-center space-y-4 text-base w-full">
              {navLinksData.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col items-center space-y-4 mt-4 w-full">
              <div className="flex items-center justify-center w-full">
                <ThemeToggle />
              </div>
              {loginButtonElement}
              {signupButtonElement}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DATA } from "../constants/data";
import { MiniNavbar } from "@/components/navigation/MiniNavbar";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "../auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: DATA.title,
  description: DATA.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <SessionProvider session={session}>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <MiniNavbar />
          <Toaster richColors />
          {children}
        </body>
      </SessionProvider>
    </html>
  );
}

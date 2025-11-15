import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DATA } from "../constants/data";
import { MiniNavbar } from "@/components/navigation/MiniNavbar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "../auth";
import { Providers } from "@/components/providers";
import FloatingCreateButton from "@/components/CreateButton";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers session={session}>
          <MiniNavbar />
          <Toaster richColors />
          {children}
          <FloatingCreateButton />
        </Providers>
      </body>
    </html>
  );
}

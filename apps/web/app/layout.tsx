import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DATA } from "../constants/data";
import { MiniNavbar } from "@/components/navigation/MiniNavbar";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MiniNavbar />
        {children}
      </body>
    </html>
  );
}

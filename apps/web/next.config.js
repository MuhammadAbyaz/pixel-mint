import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
const jiti = createJiti(fileURLToPath(import.meta.url));

await jiti.import("./env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["sntozyicoeoifambietu.supabase.co", "lh3.googleusercontent.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

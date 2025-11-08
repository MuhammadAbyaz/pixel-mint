import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
const jiti = createJiti(fileURLToPath(import.meta.url));

await jiti.import("./env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["sntozyicoeoifambietu.supabase.co", "lh3.googleusercontent.com"],
  },
};

export default nextConfig;

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    AUTH_SECRET: z.string(),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    AUTH_LOOPS_KEY: z.string(),
    AUTH_LOOPS_TRANSACTIONAL_ID: z.string().min(1),
    MAX_TOKEN_AGE: z.number().default(20 * 60),
    LOOPS_TRANSACTION_ENDPOINT: z.string(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_BUCKET_NAME: z.string(),
    PINATA_API_KEY: z.string().optional(),
    PINATA_SECRET_KEY: z.string().optional(),
    PINATA_GATEWAY: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_NFT_CONTRACT_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().optional(),
    NEXT_PUBLIC_ALCHEMY_RPC_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_LOOPS_KEY: process.env.AUTH_LOOPS_KEY,
    AUTH_LOOPS_TRANSACTIONAL_ID: process.env.AUTH_LOOPS_TRANSACTIONAL_ID,
    MAX_TOKEN_AGE: Number(process.env.MAX_TOKEN_AGE),
    LOOPS_TRANSACTION_ENDPOINT: process.env.LOOPS_TRANSACTION_ENDPOINT,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_BUCKET_NAME: process.env.SUPABASE_BUCKET_NAME,
    PINATA_API_KEY: process.env.PINATA_API_KEY,
    PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY,
    PINATA_GATEWAY: process.env.PINATA_GATEWAY,
    NEXT_PUBLIC_NFT_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_ALCHEMY_RPC_URL: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL,
  },
});

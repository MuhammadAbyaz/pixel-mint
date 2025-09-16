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
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_LOOPS_KEY: process.env.AUTH_LOOPS_KEY,
    AUTH_LOOPS_TRANSACTIONAL_ID: process.env.AUTH_LOOPS_TRANSACTIONAL_ID,
    MAX_TOKEN_AGE: Number(process.env.MAX_TOKEN_AGE),
    LOOPS_TRANSACTION_ENDPOINT: process.env.LOOPS_TRANSACTION_ENDPOINT,
  },
});

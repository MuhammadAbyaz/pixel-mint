import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";

async function main() {
  const client = postgres(env.DATABASE_URL, { prepare: false });
  return drizzle({ client });
}

export const db = main();

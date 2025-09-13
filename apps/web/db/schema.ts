import * as p from "drizzle-orm/pg-core";

// USERS table
export const users = p.pgTable("users", {
  id: p.serial().primaryKey(),
  name: p.text(),
  email: p.text().unique(),
  password: p.text(),
});

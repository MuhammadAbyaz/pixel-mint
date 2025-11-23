import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import Loops from "next-auth/providers/loops";
import { env } from "./env";
import { eq, InferInsertModel } from "drizzle-orm";
import { AdapterAccountType } from "@auth/core/adapters";

const authConfig = NextAuth({
  providers: [
    Google,
    // @ts-expect-error next-auth types are outdated
    Loops({
      apiKey: env.AUTH_LOOPS_KEY,
      transactionalId: env.AUTH_LOOPS_TRANSACTIONAL_ID,
      generateVerificationToken() {
        return String(Math.floor(100000 + Math.random() * 900000));
      },
      maxAge: env.MAX_TOKEN_AGE,
      async sendVerificationRequest({ identifier, token, provider }) {
        const { apiKey, transactionalId } = provider;
        const res = await fetch(env.LOOPS_TRANSACTION_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionalId,
            email: identifier,
            dataVariables: { code: token },
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error("Loops error:", err);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!user?.email) return false;

      const userResponse = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);
      const existingUser = userResponse[0];

      if (!existingUser) return true;

      const accountResponse = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, existingUser.id))
        .limit(1);
      const existingAccount = accountResponse[0];

      if (!existingAccount && account) {
        type NewAccount = InferInsertModel<typeof accounts>;
        const newAccount: NewAccount = {
          userId: existingUser.id,
          type: account.type as AdapterAccountType,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: null,
        };

        await db.insert(accounts).values(newAccount);
      }

      return true;
    },
  },
  pages: {
    error: "/auth/login",
  },
});

export const { handlers } = authConfig;
export const signIn: typeof authConfig.signIn = authConfig.signIn;
export const signOut: typeof authConfig.signOut = authConfig.signOut;
export const auth: typeof authConfig.auth = authConfig.auth;

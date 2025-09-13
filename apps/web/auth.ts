import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const authConfig = NextAuth({
  providers: [Google],
});

export const { handlers } = authConfig;
export const signIn: typeof authConfig.signIn = authConfig.signIn;
export const signOut: typeof authConfig.signOut = authConfig.signOut;
export const auth: typeof authConfig.auth = authConfig.auth;

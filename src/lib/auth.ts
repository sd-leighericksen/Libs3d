import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { z } from "zod";
import type { AdminRole } from "@prisma/client";
import { prisma } from "./db";
import { logActivity } from "./activity";

declare module "next-auth" {
  interface Session {
    user: { id: string; username: string; role: AdminRole } & DefaultSession["user"];
  }
}

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;
        const user = await prisma.adminUser.findUnique({ where: { username } });
        if (!user) {
          // Equalise timing against existence probing.
          await argon2.hash("dummy");
          return null;
        }
        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) return null;
        await logActivity({
          actorId: user.id,
          actorName: user.username,
          action: "auth.login",
          summary: `${user.username} signed in`,
        });
        return { id: user.id, name: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.username = user.name ?? "";
        token.role = (user as { role?: AdminRole }).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) ?? "";
        session.user.role = (token.role as AdminRole) ?? "admin";
      }
      return session;
    },
  },
});

const RANK: Record<AdminRole, number> = { shopkeeper: 1, admin: 2 };

/** Any signed-in admin user (admin or shopkeeper). */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/**
 * Require at least the given role. `admin` outranks `shopkeeper`, so
 * requireRole("shopkeeper") admits both, while requireRole("admin") admits only
 * admins. Returns the user, or null if unauthorised.
 */
export async function requireRole(min: AdminRole) {
  const user = await requireAdmin();
  if (!user) return null;
  return RANK[user.role] >= RANK[min] ? user : null;
}

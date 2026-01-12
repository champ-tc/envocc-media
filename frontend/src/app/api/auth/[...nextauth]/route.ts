import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

export const runtime = "nodejs";

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";

/* --------- Module augmentation: เพิ่ม email/image ให้ถูก type --------- */
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: string;
      name: string;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: number;
    role: string;
    name: string;
  }
}
/* --------------------------------------------------------------------- */

// ใช้ type เฉพาะไฟล์นี้สำหรับ token
type AppJWT = NextAuthJWT & { id: number; name: string; role: string };
type AppUser = { id: number; name: string; role: string };
type Cred = { username: string; password: string };

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        const { username, password } = (credentials ?? {}) as Partial<Cred>;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return { id: user.id, name: user.username, role: user.role };
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 60 * 60, updateAge: 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },

  // dev-friendly cookie
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const uid = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
        (token as AppJWT).id = uid;
        (token as AppJWT).role = (user as AppUser).role;
        (token as AppJWT).name = (user as AppUser).name;
        token.sub = String(uid);
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as AppJWT;
      session.user = {
        id: t.id,           // ✅ ใช้ t.id แทน cast จาก token.id
        role: t.role,
        name: t.name,
        // เก็บค่าเดิม (ถ้ามี) ให้สอดคล้องกับ type ใหม่ที่เพิ่มไว้
        email: session.user?.email ?? null,
        image: session.user?.image ?? null,
      };
      return session;
    },
  },

  logger: {
    error(code, metadata) { console.error(`[NextAuth ERROR] ${code}`, metadata); },
    warn(code) { console.warn(`[NextAuth WARN] ${code}`); },
    debug(code, metadata) { if (!isProd) console.debug(`[NextAuth DEBUG] ${code}`, metadata); },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

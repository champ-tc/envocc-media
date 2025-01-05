import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextApiHandler } from "next";

const prisma = new PrismaClient();

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: string;
      name: string;
    };
    token?: string;
  }

  interface User {
    id: number;
    name: string;
    role: string;
    token?: string;
  }

  interface JWT {
    id: number;
    role: string;
    name: string;
    currentToken?: string;
  }
}

// กำหนดค่า authOptions สำหรับการตั้งค่าการเข้าสู่ระบบ
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const { username, password } = credentials;

        try {
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) {
            throw new Error("Invalid username or password");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            throw new Error("Invalid username or password");
          }

          if (user.currentToken) {
            throw new Error(
              "userisalreadylogged"
            );
          }

          const token = Math.random().toString(36).substring(2);

          await prisma.user.update({
            where: { id: user.id },
            data: { currentToken: token },
          });

          return {
            id: user.id,
            name: user.username,
            role: user.role,
            token,
          };
        } catch (error) {
          console.error("Authorization Error:", error);
          throw new Error(error instanceof Error ? error.message : "Unknown error");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
    updateAge: 60 * 15, // 15 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;  // Type assertion
        token.name = user.name;
        token.currentToken = user.token as string;  // Type assertion
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as number },  // Type assertion
      });

      if (!dbUser || dbUser.currentToken !== token.currentToken) {
        throw new Error("Session invalidated. Please log in again.");
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as number, // Type assertion
        role: token.role as string,
        name: token.name as string,
      };

      session.token = token.currentToken as string;  // Type assertion
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await prisma.user.update({
          where: { id: token.id as number }, // Type assertion
          data: { currentToken: null },
        });
      }
    },
  },
};

// Named exports for each HTTP method (GET and POST)
export const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  return NextAuth(req, res, authOptions);
};

export const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  return NextAuth(req, res, authOptions);
};

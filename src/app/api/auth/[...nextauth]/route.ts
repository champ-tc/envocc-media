// src/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface User {
  id: number;
  name: string;
  role: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      role: string;
      name: string;
    };
    token?: any; // เพิ่ม token ลงใน Session
  }

  interface User {
    id: number;
    role: string;
    name: string;
  }

  interface JWT {
    id: number;
    role: string;
    name: string;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const { username, password } = credentials;

        try {
          const user = await prisma.user.findUnique({
            where: { username },
          });
        try {
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;

          return {
            id: user.id,
            name: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error("Authorization Error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
    updateAge: 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as number,
        role: token.role as string,
        name: token.name as string,
      };
      session.token = token;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
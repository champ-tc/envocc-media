// pages/api/auth/[...nextauth].ts

import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const { username, password } = credentials;

        if (!username || !password) {
          return null;
        }

        try {
          // ค้นหาผู้ใช้ในฐานข้อมูล
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) return null;

          // ตรวจสอบการเปรียบเทียบรหัสผ่าน
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;

          // คืนค่าผู้ใช้หากผ่านการยืนยัน
          return {
            id: user.id,
            role: user.role,
            name: user.name || user.username,
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
    maxAge: 60 * 60, // 1 ชั่วโมง
    updateAge: 60 * 60, // อัพเดตทุก 1 ชั่วโมง
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
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          role: token.role,
          name: token.name,
        };
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

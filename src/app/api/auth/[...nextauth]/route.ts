import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
    id?: number | null; // เพิ่ม null หากต้องการ
    role?: string | null; // เพิ่ม null หากต้องการ
    name?: string | null; // เพิ่ม null หากต้องการ
    currentToken?: string | null; // เพิ่ม null หากต้องการ
  }
}





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
          throw new Error("User is already logged in.");
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
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60, // 1 hour
    updateAge: 30, // 15 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? 0;
        token.role = user.role ?? "user";
        token.name = user.name ?? "Anonymous";
        token.currentToken = user.token ?? "";
      }
    
      if (!token.currentToken) {
        return {}; // Invalid token if currentToken is missing
      }
    
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as number },
      });
    
      if (!dbUser || dbUser.currentToken !== token.currentToken) {
        // Invalidate the token if currentToken does not match or the user is not found
        await prisma.user.update({
          where: { id: token.id as number },
          data: { currentToken: null },
        });
        return {}; // Return an empty token to invalidate it
      }
    
      return token;
    }
    
    
    ,
    async session({ session, token }) {
      session.user = {
        id: token.id as number, // บังคับว่าเป็น number
        role: token.role as string, // บังคับว่าเป็น string
        name: token.name as string, // บังคับว่าเป็น string
      };

      session.token = token.currentToken as string; // บังคับว่าเป็น string

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (typeof token.id === "number") {
        await prisma.user.update({
          where: { id: token.id },
          data: { currentToken: null },
        });
      }
    },
  },
};

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}


// Named exports for each HTTP method (GET and POST)
export const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  return NextAuth(req, res, authOptions);
};

export const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  return NextAuth(req, res, authOptions);
};

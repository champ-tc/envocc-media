import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import csrf from 'csrf';

const prisma = new PrismaClient();
const tokens = new csrf();

export async function GET(req: NextRequest) {
  const csrfToken = tokens.create(process.env.CSRF_SECRET || 'secret');
  return NextResponse.json({ csrfToken });
}

async function csrfCheck(req: NextRequest) {
  const token = req.headers.get("x-csrf-token");
  return tokens.verify(process.env.CSRF_SECRET || 'secret', token || '');
}

export async function POST(req: NextRequest) {
  const { username, email, password, title, firstName, lastName, phoneNumber, department, position, checkOnly } = await req.json();

  if (!csrfCheck(req)) {
    return NextResponse.json({ error: 'Invalid CSRF Token' }, { status: 403 });
  }

  try {
    if (checkOnly) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email },
          ],
        },
      });

      if (existingUser) {
        const errorField = existingUser.username === username ? "Username" : "Email";
        return NextResponse.json({ error: `${errorField} นี้มีอยู่ในระบบแล้ว` }, { status: 400 });
      }

      return NextResponse.json({ message: "สามารถใช้ข้อมูลนี้ได้" }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        title,
        firstName,
        lastName,
        tel: phoneNumber,
        department,
        position,
        role: "user",
      },
    });

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error("Error creating or checking user:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}

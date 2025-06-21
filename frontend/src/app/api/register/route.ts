import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema สำหรับตรวจสอบข้อมูลที่ส่งเข้ามา
const registerSchema = z.object({
  username: z.string().min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร"),
  email: z.string().email("รูปแบบ Email ไม่ถูกต้อง"),
  password: z.string().min(6, "Password ต้องมีอย่างน้อย 6 ตัวอักษร"),
  title: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  department: z.string().min(1),
  position: z.string().optional(),
  checkOnly: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ถ้า checkOnly = true ให้ validate เฉพาะ username กับ email
    if (body.checkOnly === true) {
      const checkSchema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        checkOnly: z.boolean().optional(),
      });

      const { username, email } = checkSchema.parse(body);


      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (existingUser) {
        const errorField = existingUser.email === email ? 'Email' : 'Username';
        return NextResponse.json(
          { error: `${errorField} นี้มีอยู่ในระบบแล้ว` },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: "สามารถใช้ข้อมูลนี้ได้" }, { status: 200 });
    }

    // ถ้าไม่ใช่ checkOnly = true ให้ validate แบบเต็ม
    const {
      username,
      email,
      password,
      title,
      firstName,
      lastName,
      phoneNumber,
      department,
      position,
    } = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "มีผู้ใช้นี้อยู่ในระบบแล้ว" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
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
        role: 'user',
      },
    });

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error("❌ Zod Validation Errors:", error.errors);
      return NextResponse.json(
        { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    console.error("❌ Unknown error during registration:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ภายหลัง" },
      { status: 500 }
    );
  }
}


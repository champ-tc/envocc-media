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

    // ตรวจสอบข้อมูลด้วย zod
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
      checkOnly,
    } = registerSchema.parse(body);

    // ตรวจสอบว่ามี Email หรือ Username ซ้ำหรือไม่
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (checkOnly) {
      if (existingUser) {
        const errorField = existingUser.email === email ? 'Email' : 'Username';
        return NextResponse.json(
          { error: `${errorField} นี้มีอยู่ในระบบแล้ว` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { message: "สามารถใช้ข้อมูลนี้ได้" },
        { status: 200 }
      );
    }

    // สร้างรหัสผ่าน Hash
    const hashedPassword = await bcrypt.hash(password, 12);

    // บันทึกผู้ใช้ใหม่ในระบบ
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
      return NextResponse.json(
        { error: "ข้อมูลที่ส่งมาไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error("❌ User registration error:", error.message);
    } else {
      console.error("❌ Unknown error during registration:", error);
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ภายหลัง" },
      { status: 500 }
    );
  }
}

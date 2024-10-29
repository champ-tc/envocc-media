import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { username, email, password, title, firstName, lastName, phoneNumber, department, position, checkOnly } = await req.json();

  try {
    // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่
    if (checkOnly) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        return NextResponse.json({ error: `"${username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น` }, { status: 400 });
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json({ error: `"${email}" มีอยู่ในระบบแล้ว กรุณาใช้ email อื่น` }, { status: 400 });
      }

      return NextResponse.json({ message: "สามารถใช้ username และ email นี้ได้" }, { status: 200 });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่ในฐานข้อมูล
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
        role: "user", // ตั้งค่าบทบาทเป็น user
      },
    });

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error("Error creating or checking user:", error);
    return NextResponse.json({ error: 'Registration or check failed' }, { status: 500 });
  }
}

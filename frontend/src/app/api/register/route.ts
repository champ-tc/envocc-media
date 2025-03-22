import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  
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
  } = await req.json();

  try {
    // ตรวจสอบว่ามี Email หรือ Username ซ้ำหรือไม่
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (checkOnly) {
      // หากมี CheckOnly ให้ตรวจสอบและส่ง Error
      if (existingUser) {
        const errorField = existingUser.email === email ? 'Email' : 'Username';
        return NextResponse.json(
          { error: `${errorField} นี้มีอยู่ในระบบแล้ว` },
          { status: 400 }
        );
      }
      // หากไม่มีปัญหา ส่งข้อความว่าใช้ได้
      return NextResponse.json(
        { message: "สามารถใช้ข้อมูลนี้ได้" },
        { status: 200 }
      );
    }

    // สร้างรหัสผ่าน Hash
    const hashedPassword = await bcrypt.hash(password, 12);

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
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

    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

    // สร้าง JWT
    // const token = jwt.sign(
    //   {
    //     id: newUser.id,
    //     name: newUser.username,
    //     role: newUser.role,
    //   },
    //   jwtSecret,
    //   { expiresIn: '1h' }
    // );

    return NextResponse.json(
      { message: 'User created successfully'},
      { status: 201 }
    );
  } catch (error) {
    // if (process.env.NODE_ENV === "development") {
    //   console.error("System Error:", error); // แสดง Error ในโหมดพัฒนา
    // }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ภายหลัง" },
      { status: 500 }
    );
  }
}
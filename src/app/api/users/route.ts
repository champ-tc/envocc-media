import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

// ดึงข้อมูลผู้ใช้ทั้งหมด
export async function GET() {
    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
    }
}

// เพิ่มผู้ใช้ใหม่
export async function POST(req: Request) {
    try {
        const { name, email, role, password } = await req.json();

        if (![name, email, role, password].every(Boolean)) {
            return NextResponse.json({ error: "All fields (name, email, role, password) are required" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            
            data: { name, email, password: hashedPassword, role },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error adding user" }, { status: 500 });
    }
}

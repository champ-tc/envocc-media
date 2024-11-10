import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt"; // ใช้สำหรับตรวจสอบสิทธิ์

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === 'admin');
}

// ดึงข้อมูลผู้ใช้ทั้งหมด (ต้องการสิทธิ์ admin)
export async function GET(request: Request) {
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
    }
}

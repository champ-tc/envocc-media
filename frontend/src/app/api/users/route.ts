import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === "admin");
}

// ดึงข้อมูลผู้ใช้ทั้งหมด (ต้องการสิทธิ์ admin)
export async function GET(request: NextRequest) {
    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
    }
}

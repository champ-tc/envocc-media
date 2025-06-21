import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';



// ดึงข้อมูลผู้ใช้ทั้งหมด (ต้องการสิทธิ์ admin)
export async function GET(request: NextRequest) {
    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
    }
}

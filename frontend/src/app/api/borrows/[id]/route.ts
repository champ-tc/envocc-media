import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === "admin" || token.role === "user"));
}

// GET: ดึงข้อมูล Borrow ตาม ID
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        // Unwrap params
        const { id } = await context.params;

        // ตรวจสอบสิทธิ์
        if (!(await checkAdminOrUserSession(request))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // ตรวจสอบว่า ID เป็นตัวเลข
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // ดึงข้อมูลจากฐานข้อมูล
        const borrow = await prisma.borrow.findUnique({
            where: { id: parsedId },
            include: {
                type: true,
            },
        });

        if (!borrow) {
            return NextResponse.json({ error: "Borrow not found" }, { status: 404 });
        }

        return NextResponse.json(borrow, { status: 200 });
    } catch (error) {
        console.error("Error fetching borrow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

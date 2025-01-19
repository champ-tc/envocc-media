import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// ตรวจสอบสิทธิ์ของผู้ใช้
async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === "admin" || token.role === "user"));
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    // Unwrap params ด้วย await
    const { id } = await context.params;

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const requisitionId = parseInt(id, 10); // แปลง id เป็นตัวเลข
        if (isNaN(requisitionId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // ดึงข้อมูล requisition จากฐานข้อมูล
        const requisition = await prisma.requisition.findUnique({
            where: { id: requisitionId },
            include: { type: true },
        });

        // ตรวจสอบว่ามีข้อมูลหรือไม่
        if (!requisition) {
            return NextResponse.json({ message: "Requisition not found" }, { status: 404 });
        }

        const remaining = requisition.quantity - (requisition.reserved_quantity || 0);

        return NextResponse.json({
            ...requisition,
            remaining,
            requisition_images: `/requisitions/${requisition.requisition_images}`,
        });
    } catch (error) {
        console.error("Error fetching requisition:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

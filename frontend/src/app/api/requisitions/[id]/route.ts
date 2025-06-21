import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';


export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {

    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

    // Unwrap params ด้วย await
    const { id } = await context.params;


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

        const remaining = requisition.quantity;


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

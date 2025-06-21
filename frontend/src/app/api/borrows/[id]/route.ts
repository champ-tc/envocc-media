import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';

// GET: ดึงข้อมูล Borrow ตาม ID
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {

    const access = await protectApiRoute(request, ['admin', 'user']);
    if (access !== true) return access;

    try {
        // Unwrap params
        const { id } = await context.params;


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

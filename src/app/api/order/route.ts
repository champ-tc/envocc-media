import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// เพิ่มคำสั่งซื้อ
export async function POST(req: Request) {
    try {
        const { userId, requisitionId, requisition_type, quantity } = await req.json();
        const date = new Date();

        // ตรวจสอบว่ามี requisitionId หรือ borrowId
        if (!requisitionId || !userId || !quantity || !requisition_type) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        // ตรวจสอบ Requisition (เฉพาะกรณีที่ requisition_type เป็นการเบิก)
        if (requisition_type === 1) {
            const requisition = await prisma.requisition.findUnique({ where: { id: requisitionId } });

            if (!requisition) {
                return NextResponse.json({ message: "Requisition not found" }, { status: 404 });
            }

            // ตรวจสอบว่ามีสินค้าคงเหลือเพียงพอหรือไม่
            if (quantity > requisition.quantity) {
                return NextResponse.json({ message: "Not enough stock available" }, { status: 400 });
            }
        }

        // สร้างคำสั่งซื้อในตาราง Order โดยไม่แก้ไขตาราง Requisition
        const order = await prisma.order.create({
            data: {
                userId,
                requisitionId: requisitionId,
                requisition_type,
                quantity,
                date,
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error adding order:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


// ดึงรายการคำสั่งซื้อ
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: parseInt(userId) },
            include: {
                requisition: true, // ดึงข้อมูล requisition มาด้วย
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

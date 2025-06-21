import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';


// สร้าง Order
export async function POST(req: NextRequest) {
    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

    try {
        const body = await req.json();
        const { userId, requisitionId, requisition_type, quantity } = body;

        const newOrder = await prisma.order.create({
            data: {
                userId,
                requisitionId,
                requisition_type,
                quantity,
            },
        });

        return NextResponse.json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
        console.error("Error adding order:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// ลบ Order
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

    const { id } = await context.params; // Unwrap params


    try {
        const orderId = parseInt(id, 10);

        if (isNaN(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
        }

        const deletedOrder = await prisma.order.delete({
            where: { id: orderId },
        });

        return NextResponse.json({ message: "Order deleted successfully", deletedOrder });
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}

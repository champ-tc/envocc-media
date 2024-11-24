import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST method to add data to Order table
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, requisitionId, requisition_type, quantity } = body;

        // Add data to Order table
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
        return NextResponse.json(
            { error: "Failed to create order", details: error.message },
            { status: 500 }
        );
    }
}



// ลบ Order
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const orderId = parseInt(params.id);

        if (isNaN(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
        }

        // ลบ Order จากฐานข้อมูล
        const deletedOrder = await prisma.order.delete({
            where: { id: orderId },
        });

        return NextResponse.json({ message: "Order deleted successfully", deletedOrder });
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}

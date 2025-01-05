import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from 'next-auth/jwt';

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === 'admin' || token.role === 'user'));
}


export async function POST(req: Request) {
    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
        console.error("Error adding order:");
        return NextResponse.json(
            { message: "Internal Server Error" }, 
            { status: 500 }
        );
    }
}


// ลบ Order
export async function DELETE(req: Request, { params }: { params: { id: string } }) {

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    try {
        const orderId = parseInt(params.id);

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

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';


// POST: สร้าง BorrowLog (ไม่ใช้ ID จาก params)
export async function POST(req: NextRequest) {
    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    try {
        const { userId, orders, deliveryMethod, address, returnDate, usageReason } = await req.json();

        if (!userId || !orders || orders.length === 0 || !returnDate || !usageReason) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        const borrowGroupId = `group${Math.floor(Math.random() * 10000)}`;

        const borrowLogs = await Promise.all(
            orders
                .filter((order: { borrowId?: number }) => order.borrowId)
                .map((order: { borrowId: number; quantity: number }) =>
                    prisma.borrowLog.create({
                        data: {
                            borrow_id: order.borrowId,
                            user_id: userId,
                            quantity: order.quantity,
                            return_due_date: new Date(returnDate),
                            status: "Pending",
                            delivery_method: deliveryMethod,
                            delivery_address: deliveryMethod === "delivery" ? address : null,
                            borrow_groupid: borrowGroupId,
                            usageReason: Number(usageReason),
                        },
                    })
                )
        );

        await prisma.order.deleteMany({
            where: {
                userId,
                requisition_type: 2,
            },
        });

        return NextResponse.json({
            message: "Borrow submitted successfully",
            borrowLogs,
            borrowGroupId,
        });
    } catch (error: unknown) {
        console.error("Error submitting borrow:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// GET: ดึง BorrowLog ตาม ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    const { id } = await context.params;

    try {
        const log = await prisma.borrowLog.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                borrow: true,
                user: true,
            },
        });

        if (!log) {
            return NextResponse.json({ error: "BorrowLog not found" }, { status: 404 });
        }

        return NextResponse.json(log);
    } catch (error: unknown) {
        console.error("Error fetching borrow log by ID:", error);
        return NextResponse.json({ error: "Failed to fetch borrow log" }, { status: 500 });
    }
}

// PUT: อัปเดต BorrowLog ตาม ID
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    const { id } = await context.params;

    try {
        const body = await req.json();

        const updatedLog = await prisma.borrowLog.update({
            where: { id: parseInt(id, 10) },
            data: body,
        });

        return NextResponse.json(updatedLog);
    } catch (error: unknown) {
        console.error("Error updating borrow log:", error);
        return NextResponse.json({ error: "Failed to update borrow log" }, { status: 500 });
    }
}


export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    const { id } = await context.params;

    try {
        await prisma.borrowLog.delete({
            where: { id: parseInt(id, 10) },
        });

        return NextResponse.json({ message: "BorrowLog deleted successfully" });
    } catch (error: unknown) {
        console.error("Error deleting borrow log:", error);
        return NextResponse.json({ error: "Failed to delete borrow log" }, { status: 500 });
    }
}
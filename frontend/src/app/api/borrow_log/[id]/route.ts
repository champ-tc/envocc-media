import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

// POST: สร้าง BorrowLog
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
                            usageReason: Number(usageReason), // ✅ แก้ตรงนี้เป็น number
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
    } catch (error) {
        console.error("Error submitting borrow:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


// GET: ดึงข้อมูล BorrowLog ตาม ID
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

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
    } catch (error) {
        console.error("Error fetching borrow log by ID:", error);
        return NextResponse.json({ error: "Failed to fetch borrow log" }, { status: 500 });
    }
}

// PUT: อัปเดต BorrowLog ตาม ID
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        const body = await req.json();

        const updatedLog = await prisma.borrowLog.update({
            where: { id: parseInt(id, 10) },
            data: body,
        });

        return NextResponse.json(updatedLog);
    } catch (error) {
        console.error("Error updating borrow log:", error);
        return NextResponse.json({ error: "Failed to update borrow log" }, { status: 500 });
    }
}

// DELETE: ลบ BorrowLog ตาม ID
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    try {
        await prisma.borrowLog.delete({
            where: { id: parseInt(id, 10) },
        });

        return NextResponse.json({ message: "BorrowLog deleted successfully" });
    } catch (error) {
        console.error("Error deleting borrow log:", error);
        return NextResponse.json({ error: "Failed to delete borrow log" }, { status: 500 });
    }
}

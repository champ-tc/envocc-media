import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { userId, orders, deliveryMethod, address, returnDate } = await req.json();

        if (!userId || !orders || orders.length === 0 || !returnDate) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        // สร้าง borrow_groupid แบบสุ่ม
        const borrowGroupId = `group${Math.floor(Math.random() * 10000)}`;

        // เพิ่มข้อมูลใน BorrowLog
        const borrowLogs = await Promise.all(
            orders
                .filter((order: { borrowId?: number }) => order.borrowId) // ตรวจสอบเฉพาะ borrow
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
                            borrow_groupid: borrowGroupId, // กำหนด borrow_groupid
                        },
                    })
                )
        );

        // ลบข้อมูลใน Order เฉพาะ requisition_type = 2 (ยืม)
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
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
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
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const body = await req.json();

    try {
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
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

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

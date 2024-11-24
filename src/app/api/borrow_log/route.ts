import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// POST: เพิ่มข้อมูลการยืม
export async function POST(req: Request) {
    try {
        const { userId, orders, deliveryMethod, address, borrowGroupId, returnDate } = await req.json();

        if (!userId || !orders || orders.length === 0 || !returnDate) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        // ตรวจสอบ borrowId ใน orders
        const borrowIds = orders.map((order) => order.borrowId);
        const existingBorrows = await prisma.borrow.findMany({
            where: { id: { in: borrowIds } },
        });

        if (existingBorrows.length !== borrowIds.length) {
            return NextResponse.json({ message: "Invalid borrow IDs", borrowIds }, { status: 400 });
        }

        // สร้าง borrow logs
        const borrowLogs = orders.map((order) => ({
            borrow_id: order.borrowId,
            user_id: userId,
            quantity: order.quantity,
            borrow_groupid: borrowGroupId,
            return_due_date: new Date(returnDate),
            borrow_date: new Date(),
            status: "Pending",
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === "delivery" ? address : null,
        }));

        await prisma.borrowLog.createMany({ data: borrowLogs });

        return NextResponse.json({ message: "Borrow logs created successfully" });
    } catch (error) {
        console.error("Error in POST /api/borrow_log:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}

// GET: ดึงข้อมูล BorrowLog



export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const groupid = searchParams.get('groupid');

        if (groupid) {
            // กรณีดึง logs เฉพาะ groupid
            const groupLogs = await prisma.borrowLog.findMany({
                where: { borrow_groupid: groupid },
                select: {
                    id: true,
                    borrow: { select: { borrow_name: true } },
                    quantity: true,
                    returned_quantity: true,
                    actual_return_date: true,
                    approved_quantity: true,
                    status: true,
                },
            });

            return NextResponse.json(groupLogs);
        }

        // กรณีดึงข้อมูลทั้งหมด หรือกรองด้วย status
        const borrowLogs = await prisma.borrowLog.findMany({
            where: status ? { status } : undefined,
            select: {
                borrow_groupid: true,
                user: { select: { title: true, firstName: true, lastName: true } },
                status: true,
                actual_return_date: true,
            },
            distinct: ['borrow_groupid'],
        });

        return NextResponse.json(borrowLogs);
    } catch (error) {
        console.error('Error fetching borrow logs:', error);
        return NextResponse.json({ error: 'Failed to fetch borrow logs' }, { status: 500 });
    }
}
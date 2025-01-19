import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === 'admin' || token.role === 'user'));
}

export async function POST(request: Request) {

    if (!(await checkAdminOrUserSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {

        const { userId, orders, deliveryMethod, address, returnDate } = await request.json();

        if (!userId || !orders || !returnDate) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // ตรวจสอบว่า userId มีอยู่ในระบบ
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        // ตรวจสอบรูปแบบของวันที่คืน
        const parsedReturnDate = new Date(returnDate);
        if (isNaN(parsedReturnDate.getTime())) {
            return NextResponse.json({ message: "Invalid return date format" }, { status: 400 });
        }

        // สร้าง group ID ใหม่
        const newGroupId = uuidv4();

        // สร้างข้อมูล borrow logs
        const borrowLogs = orders.map((order: { borrowId: number; quantity: number }) => ({
            borrow_id: order.borrowId,
            user_id: userId,
            quantity: order.quantity,
            borrow_groupid: newGroupId,
            return_due_date: parsedReturnDate, // ใช้วันที่ที่จัดรูปแบบแล้ว
            borrow_date: new Date(),
            status: "Pending",
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === "delivery" ? address : null,
        }));

        // ใช้ transaction เพื่อสร้าง borrow log และลบข้อมูลจากตาราง order
        await prisma.$transaction([
            prisma.borrowLog.createMany({ data: borrowLogs }),
            prisma.order.deleteMany({
                where: {
                    userId: userId,
                    borrowId: { in: orders.map((o: { borrowId: number }) => o.borrowId) },
                },
            }),
        ]);

        return NextResponse.json({
            message: "Borrow logs created successfully",
            groupId: newGroupId,
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Internal Server Error", error: (error as Error).message },
            { status: 500 }
        );
    }
}

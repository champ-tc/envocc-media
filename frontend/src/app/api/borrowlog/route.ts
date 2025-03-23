import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { sendLineGroupMessage } from "@/lib/lineNotify";

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === 'admin' || token.role === 'user'));
}

export async function POST(request: Request) {
    if (!(await checkAdminOrUserSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const {
            userId,
            orders,
            deliveryMethod,
            address,
            returnDate,
            usageReasonId,
            customUsageReason,
        } = await request.json();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { title: true, firstName: true, lastName: true }
        });

        if (!user) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        // Validation
        if (!userId || !orders || !returnDate || usageReasonId === null || usageReasonId === undefined) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        const parsedReturnDate = new Date(returnDate);
        if (isNaN(parsedReturnDate.getTime())) {
            return NextResponse.json({ message: "Invalid return date format" }, { status: 400 });
        }

        const newGroupId = uuidv4();

        const borrowLogs = orders.map((order: { borrowId: number; quantity: number }) => ({
            borrow_id: order.borrowId,
            user_id: userId,
            quantity: order.quantity,
            borrow_groupid: newGroupId,
            return_due_date: parsedReturnDate,
            borrow_date: new Date(),
            status: "Pending",
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === "delivery" ? address : null,
            usageReason: usageReasonId,
            customUsageReason: usageReasonId === 0 ? customUsageReason : null,
        }));

        await prisma.$transaction([
            prisma.borrowLog.createMany({ data: borrowLogs }),
            prisma.order.deleteMany({
                where: {
                    userId: userId,
                    borrowId: { in: orders.map((o: { borrowId: number }) => o.borrowId) },
                },
            }),
        ]);

        // ดึงชื่อเหตุผลการใช้งาน (ถ้ามี)
        const reason = await prisma.reason.findUnique({
            where: { id: usageReasonId },
            select: { reason_name: true }
        });

        await sendLineGroupMessage(
            "ยืม",
            `${user.title ?? ""}${user.firstName} ${user.lastName}`,
            orders.reduce((sum: number, o: { quantity: number }) => sum + o.quantity, 0),
            new Date().toLocaleDateString("th-TH"),
            usageReasonId === 0 ? customUsageReason : reason?.reason_name || "ไม่ระบุ"
        );



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


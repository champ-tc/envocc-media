import { NextResponse, type NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { sendLineGroupMessage } from "@/lib/lineNotify";
import { protectApiRoute } from '@/lib/protectApi';

export async function POST(request: NextRequest) {
    const access = await protectApiRoute(request, ['admin', 'user']);
    if (access !== true) return access;

    try {
        const {
            userId,
            orders,
            deliveryMethod,
            address,
            returnDate,
            usageReasonId,
            customUsageReason,
            evaluation // ✅ รับข้อมูลประเมิน
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

        // ✅ เตรียม Transaction
        const transactionOperations: any[] = [
            prisma.borrowLog.createMany({ data: borrowLogs }),
            prisma.order.deleteMany({
                where: {
                    userId: userId,
                    borrowId: { in: orders.map((o: { borrowId: number }) => o.borrowId) },
                },
            }),
        ];

        // ถ้ามีข้อมูลประเมินส่งมาด้วย ให้เพิ่มลงใน Transaction
        if (evaluation) {
            transactionOperations.push(
                prisma.evaluation.create({
                    data: {
                        userId: userId,
                        actionType: "borrow", // ระบุว่าเป็นยืม
                        transactionGroupId: newGroupId,
                        satisfaction: evaluation.satisfaction,
                        convenience: evaluation.convenience,
                        reuseIntention: evaluation.reuseIntention,
                        recommend: evaluation.recommend,
                        suggestion: evaluation.suggestion,
                    }
                })
            );
        }

        // รัน Transaction
        await prisma.$transaction(transactionOperations);

        // Line Notify
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
            message: "Borrow logs and evaluation created successfully",
            groupId: newGroupId,
        });
    } catch (error) {
        console.error("Borrow Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: (error as Error).message },
            { status: 500 }
        );
    }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

interface Order {
    borrowId: string; // Borrow IDs are strings in the request
    quantity: number;
}

async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

export async function POST(request: Request) {

    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const {
            userId,
            orders,
            deliveryMethod,
            address,
            borrowGroupId,
            returnDate,
        }: {
            userId: string | number;
            orders: Order[];
            deliveryMethod: string;
            address: string;
            borrowGroupId: string;
            returnDate: string;
        } = await request.json();

        if (!userId || !orders || orders.length === 0 || !returnDate) {
            return NextResponse.json(
                { message: "Invalid data" },
                { status: 400 }
            );
        }

        // Convert borrowIds to numbers
        const borrowIds = orders.map((order) => Number(order.borrowId));
        const existingBorrows = await prisma.borrow.findMany({
            where: { id: { in: borrowIds } },
        });

        if (existingBorrows.length !== borrowIds.length) {
            return NextResponse.json(
                { message: "Invalid borrow IDs", borrowIds },
                { status: 400 }
            );
        }

        // Create borrow logs
        const borrowLogs = orders.map((order) => ({
            borrow_id: Number(order.borrowId), // Ensure it's a number
            user_id: typeof userId === "string" ? parseInt(userId) : userId, // Ensure it's a number
            quantity: order.quantity,
            borrow_groupid: borrowGroupId, // Non-null string
            return_due_date: new Date(returnDate), // Valid Date object
            borrow_date: new Date(), // Current date
            status: "pending", // Default value
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === "delivery" ? address : null, // Nullable
        }));

        // Insert logs into the database
        await prisma.borrowLog.createMany({ data: borrowLogs });

        return NextResponse.json({
            message: "Borrow logs created successfully",
        });
    } catch (error: unknown) {
        console.error("Error in POST /api/borrow_log:", error);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
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
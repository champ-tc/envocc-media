import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// ฟังก์ชันตรวจสอบสิทธิ์
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

// เพิ่มข้อมูลใน RequisitionLog
export async function POST(req: Request) {
    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { userId, orders, deliveryMethod, address } = await req.json();

        if (!userId || !orders || orders.length === 0) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        const requisitionLogs = await Promise.all(
            orders
                .filter((order: { requisitionId?: number }) => order.requisitionId)
                .map((order: { requisitionId: number; quantity: number }) =>
                    prisma.requisitionLog.create({
                        data: {
                            requisition_id: order.requisitionId,
                            user_id: userId,
                            requested_quantity: order.quantity,
                            status: "Pending",
                            requested_groupid: `group${Math.floor(Math.random() * 10000)}`,
                            delivery_method: deliveryMethod,
                            delivery_address: deliveryMethod === "delivery" ? address : null,
                        },
                    })
                )
        );

        await prisma.order.deleteMany({
            where: {
                userId,
                requisition_type: 1,
            },
        });

        return NextResponse.json({
            message: "Requisition submitted successfully",
            requisitionLogs,
        });
    } catch (error) {
        console.error("Error submitting requisition:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// ดึงข้อมูล requisition log ตาม ID
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params
    try {
        const items = await prisma.requisitionLog.findMany({
            where: { requested_groupid: id },
            include: { requisition: true, user: true },
        });

        if (!items.length) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        return NextResponse.json({
            request_group_id: id,
            requisition_date: items[0]?.requisition_date,
            user_name: `${items[0]?.user.firstName} ${items[0]?.user.lastName}`,
            status: items[0]?.status || "รอพิจารณา",
            items: items.map((item) => ({
                id: item.id,
                requisition_name: item.requisition.requisition_name,
                requested_quantity: item.requested_quantity,
                approved_quantity: item.approved_quantity || 0,
            })),
        });
    } catch (error) {
        console.error("Error fetching requisition log:", error);
        return NextResponse.json({ error: "Failed to fetch requisition log" }, { status: 500 });
    }
}

// อัปเดต requisition log
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params
    const body = await req.json();

    try {
        const updatedLog = await prisma.requisitionLog.update({
            where: { id: Number(id) },
            data: body,
        });
        return NextResponse.json(updatedLog);
    } catch (error) {
        console.error("Error updating requisition log:", error);
        return NextResponse.json({ error: "Failed to update requisition log" }, { status: 500 });
    }
}

// ลบ requisition log
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params
    try {
        await prisma.requisitionLog.delete({
            where: { id: Number(id) },
        });
        return NextResponse.json({ message: "Requisition log deleted successfully" });
    } catch (error) {
        console.error("Error deleting requisition log:", error);
        return NextResponse.json({ error: "Failed to delete requisition log" }, { status: 500 });
    }
}

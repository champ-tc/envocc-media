import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId, orders, deliveryMethod, address } = await req.json();

        if (!userId || !orders || orders.length === 0) {
            return NextResponse.json({ message: "Invalid data" }, { status: 400 });
        }

        // เพิ่มข้อมูลใน RequisitionLog
        const requisitionLogs = await Promise.all(
            orders.map((order) =>
                prisma.requisitionLog.create({
                    data: {
                        requisition_id: order.requisitionId,
                        user_id: userId,
                        requested_quantity: order.quantity,
                        stock_after_requisition: 0, // คุณสามารถอัปเดตสต็อกหลังจากการอนุมัติ
                    },
                })
            )
        );

        // ลบข้อมูลใน Order
        await prisma.order.deleteMany({
            where: { userId },
        });

        return NextResponse.json({ message: "Requisition submitted successfully", requisitionLogs });
    } catch (error) {
        console.error("Error submitting requisition:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


// ดึงข้อมูล requisition log ตาม ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const items = await prisma.requisitionLog.findMany({
            where: { request_group_id: id },
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
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const body = await req.json();
    try {
        const updatedLog = await prisma.requisitionLog.update({
            where: { id },
            data: body,
        });
        return NextResponse.json(updatedLog);
    } catch (error) {
        console.error("Error updating requisition log:", error);
        return NextResponse.json({ error: "Failed to update requisition log" }, { status: 500 });
    }
}

// ลบ requisition log
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        await prisma.requisitionLog.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Requisition log deleted successfully" });
    } catch (error) {
        console.error("Error deleting requisition log:", error);
        return NextResponse.json({ error: "Failed to delete requisition log" }, { status: 500 });
    }
}

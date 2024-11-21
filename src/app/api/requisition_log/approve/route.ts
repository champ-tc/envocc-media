import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function PUT(req: Request) {
    try {
        const { groupId, logs } = await req.json();

        // ตรวจสอบ token จาก Header
        const token = await getToken({ req: req as any });
        if (!token || token.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const adminId = token.sub; // ใช้ user ID จาก token
        if (!adminId) {
            return NextResponse.json({ message: "Invalid admin ID" }, { status: 400 });
        }

        // ตรวจสอบ Input ที่ส่งเข้ามา
        if (!groupId || !logs || !Array.isArray(logs)) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        // อัปเดตข้อมูล requisition logs และ stock
        await Promise.all(
            logs.map(async (log) => {
                if (!log.id || typeof log.approved_quantity !== "number" || !log.requisition_id) {
                    throw new Error("Invalid log structure or missing required fields");
                }

                // ตรวจสอบ requisition ที่เกี่ยวข้อง
                const requisition = await prisma.requisition.findUnique({
                    where: { id: log.requisition_id },
                });

                if (!requisition) {
                    throw new Error(`Requisition with ID ${log.requisition_id} not found`);
                }

                // ตรวจสอบจำนวนที่อนุมัติว่าไม่เกิน stock ปัจจุบัน
                if (requisition.quantity < log.approved_quantity) {
                    throw new Error(
                        `Not enough stock for requisition ID ${log.requisition_id}. Available: ${requisition.quantity}, Requested: ${log.approved_quantity}`
                    );
                }

                const updatedStock = requisition.quantity - log.approved_quantity;

                // อัปเดต requisition log
                await prisma.requisitionLog.update({
                    where: { id: log.id },
                    data: {
                        approved_quantity: log.approved_quantity,
                        status: "Approved",
                        stock_after_requisition: updatedStock,
                        approved_by_admin_id: parseInt(adminId, 10),
                    },
                });

                // อัปเดต stock ใน requisition
                await prisma.requisition.update({
                    where: { id: log.requisition_id },
                    data: { quantity: updatedStock },
                });
            })
        );

        return NextResponse.json({ message: "Requisition approved successfully" });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error approving requisition:", error.message);
            return NextResponse.json({ message: "Internal Server Error", details: error.message }, { status: 500 });
        } else {
            console.error("Unexpected error:", error);
            return NextResponse.json({ message: "Unexpected error occurred", error: String(error) }, { status: 500 });
        }
    }
}

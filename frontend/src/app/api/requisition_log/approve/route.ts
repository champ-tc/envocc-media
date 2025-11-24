import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { protectApiRoute } from "@/lib/protectApi";
import { prisma } from "@/lib/prisma";

interface ApproveLogInput {
    id: number;
    requisition_id: number;
    approved_quantity: number;
    returned_quantity?: number;
    actual_return_date?: string | null;
}

export async function PUT(req: NextRequest) {
    const access = await protectApiRoute(req, ["admin"]);
    if (access !== true) return access;

    try {
        // ✅ อ่าน token พร้อมระบุ secret
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        console.log("🪪 FULL TOKEN:", token);

        // ✅ ตรวจสอบ token.id และแปลงเป็น number
        const adminId = Number(token?.id);
        if (!adminId || isNaN(adminId)) {
            console.log("❌ ไม่มี token หรือ token.id ไม่ถูกต้อง:", token);
            return NextResponse.json({ message: "Invalid admin ID" }, { status: 400 });
        }

        // ✅ อ่านข้อมูลจาก body
        const { groupId, logs } = await req.json();

        console.log("✅ groupId:", groupId);
        console.log("✅ logs:", logs);

        if (!groupId || !Array.isArray(logs)) {
            return NextResponse.json({
                message: "Invalid input",
                debug: { groupId, logs },
            }, { status: 400 });
        }

        // ✅ อัปเดตแต่ละ log
        await Promise.all(
            logs.map(async (log: ApproveLogInput) => {
                console.log("🔍 ตรวจ log:", log);

                if (
                    typeof log.id !== "number" ||
                    typeof log.requisition_id !== "number" ||
                    typeof log.approved_quantity !== "number"
                ) {
                    console.log("❌ log ผิดโครงสร้าง:", log);
                    throw new Error("Invalid log structure or missing required fields");
                }

                const requisition = await prisma.requisition.findUnique({
                    where: { id: log.requisition_id },
                });

                if (!requisition) {
                    throw new Error(`Requisition with ID ${log.requisition_id} not found`);
                }

                if (requisition.quantity < log.approved_quantity) {
                    throw new Error(
                        `Not enough stock for requisition ID ${log.requisition_id}. Available: ${requisition.quantity}, Requested: ${log.approved_quantity}`
                    );
                }

                const updatedStock = requisition.quantity - log.approved_quantity;

                await prisma.requisitionLog.update({
                    where: { id: log.id },
                    data: {
                        approved_quantity: log.approved_quantity,
                        status: "Approved",
                        stock_after_requisition: updatedStock,
                        approved_by_admin_id: adminId,
                    },
                });

                await prisma.requisition.update({
                    where: { id: log.requisition_id },
                    data: { quantity: updatedStock },
                });

                console.log(`✅ อัปเดตเสร็จ log ID ${log.id}, เหลือ stock: ${updatedStock}`);
            })
        );

        return NextResponse.json({ message: "Requisition approved successfully" });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ Error approving requisition:", error.message);
            return NextResponse.json(
                { message: "Internal Server Error", details: error.message },
                { status: 500 }
            );
        } else {
            console.error("❌ Unexpected error:", error);
            return NextResponse.json(
                { message: "Unexpected error occurred", error: String(error) },
                { status: 500 }
            );
        }
    }
}

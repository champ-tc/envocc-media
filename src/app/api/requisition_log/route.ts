import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ใช้สำหรับ requisition_summary
export async function POST(req: Request) {
    try {
        const { userId, orders, deliveryMethod, address, requestedGroupId } = await req.json();
        console.log("Received data:", { userId, orders, deliveryMethod, address, requestedGroupId });

        // ตรวจสอบ userId
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        // ตรวจสอบ requisitionId ทั้งหมดใน orders
        const requisitionIds = orders.map((order) => order.requisitionId);
        const existingRequisitions = await prisma.requisition.findMany({
            where: { id: { in: requisitionIds } },
        });

        if (existingRequisitions.length !== requisitionIds.length) {
            return NextResponse.json({ message: "Invalid requisition IDs", requisitionIds }, { status: 400 });
        }

        // สร้าง requisition logs
        const requisitionLogs = orders.map((order) => ({
            requisition_id: order.requisitionId,
            user_id: userId,
            requested_quantity: order.quantity,
            requested_groupid: requestedGroupId,
            requisition_date: new Date(),
            status: "Pending",
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === "delivery" ? address : null,
        }));

        await prisma.requisitionLog.createMany({ data: requisitionLogs });

        return NextResponse.json({ message: "Requisition logs created successfully" });
    } catch (error) {
        console.error("Error in POST /api/requisition_log:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}




// ดึงข้อมูล requisition log
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const requested_groupid = searchParams.get("groupid");

        if (requested_groupid) {
            // ดึงข้อมูลตาม requested_groupid
            const groupLogs = await prisma.requisitionLog.findMany({
                where: { requested_groupid },
                include: {
                    user: { select: { title: true, firstName: true, lastName: true } },
                    requisition: { select: { requisition_name: true } },
                },
            });

            // แสดงข้อมูลโดยไม่ใช้การแมปสถานะ
            return NextResponse.json(groupLogs);
        }

        // ดึงข้อมูลตาม status (ถ้ามี) หรือดึงทั้งหมด
        const requisitionLogs = await prisma.requisitionLog.findMany({
            where: status ? { status } : undefined,
            select: {
                requested_groupid: true,
                user: { select: { title: true, firstName: true, lastName: true } },
                status: true,
            },
            distinct: ["requested_groupid"], // ดึงกลุ่มที่ไม่ซ้ำกัน
        });

        // แสดงข้อมูลโดยไม่ใช้การแมปสถานะ
        return NextResponse.json(requisitionLogs);
    } catch (error) {
        console.error("Error fetching requisition logs:", error);
        return NextResponse.json({ error: "Failed to fetch requisition logs" }, { status: 500 });
    }
}


// อัปเดตสถานะ requisition log
export async function PUT(req: Request) {
    try {
        const { id, status } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        // อัปเดตสถานะ
        const updatedLog = await prisma.requisitionLog.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({
            message: "Requisition log updated successfully",
            updatedLog,
        });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

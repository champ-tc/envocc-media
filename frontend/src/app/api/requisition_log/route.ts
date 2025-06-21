import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';
import { sendLineGroupMessage } from "@/lib/lineNotify";
import { protectApiRoute } from '@/lib/protectApi';


// ใช้สำหรับ requisition_summary
export async function POST(req: NextRequest) {
    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

    try {
        const {
            userId,
            orders,
            deliveryMethod,
            address,
            usageReasonId,
            customUsageReason,
        } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { title: true, firstName: true, lastName: true }
        });

        if (!user) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        const userExists = await prisma.user.findUnique({ where: { id: userId } });

        if (!userExists) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        const requisitionIds = orders.map((order: { requisitionId: number }) => order.requisitionId);
        const existingRequisitions = await prisma.requisition.findMany({
            where: { id: { in: requisitionIds } },
        });

        if (existingRequisitions.length !== requisitionIds.length) {
            return NextResponse.json({ message: "Invalid requisition IDs", requisitionIds }, { status: 400 });
        }

        const newGroupId = uuidv4();

        const requisitionLogs = orders.map((order: { requisitionId: number; quantity: number }) => ({
            requisition_id: order.requisitionId,
            user_id: userId,
            requested_quantity: order.quantity,
            approved_quantity: null,
            stock_after_requisition: null,
            requisition_date: new Date(),
            status: "Pending",
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === "delivery" ? address : null,
            requested_groupid: newGroupId,
            usageReason: usageReasonId, // ✅ ใช้ชื่อให้ตรงกับ Prisma model
            customUsageReason: usageReasonId === 0 ? customUsageReason : null, // ✅ ตรวจสอบเมื่อเป็น "อื่นๆ"
        }));


        await prisma.$transaction([
            prisma.requisitionLog.createMany({ data: requisitionLogs }),
            prisma.order.deleteMany({
                where: {
                    userId: userId,
                    requisitionId: { in: requisitionIds },
                },
            }),
        ]);

        // ดึงชื่อเหตุผลการใช้งาน (ถ้ามี)
        const reason = await prisma.reason.findUnique({
            where: { id: usageReasonId },
            select: { reason_name: true }
        });

        await sendLineGroupMessage(
            "เบิก",
            `${user.title ?? ""}${user.firstName} ${user.lastName}`,
            orders.reduce((sum: number, o: { quantity: number }) => sum + o.quantity, 0),
            new Date().toLocaleDateString("th-TH"),
            usageReasonId === 0 ? customUsageReason : reason?.reason_name || "ไม่ระบุ"
        );



        return NextResponse.json({
            message: "Requisition logs created successfully",
            groupId: newGroupId,
        });

    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
    }
}


// ดึงข้อมูล requisition log
export async function GET(req: NextRequest) {
    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;


    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const requested_groupid = searchParams.get("groupid");

        // ค่าหน้า (page) และจำนวนต่อหน้า (limit) (ค่าเริ่มต้น: page = 1, limit = 10)
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit; // คำนวณ offset

        if (requested_groupid) {
            // ดึงข้อมูลเฉพาะ groupid ที่ร้องขอ
            const groupLogs = await prisma.requisitionLog.findMany({
                where: { requested_groupid },
                include: {
                    user: { select: { title: true, firstName: true, lastName: true } },
                    requisition: { select: { requisition_name: true } },
                    reason: true, // เอาทั้ง object มาก่อน แล้วไปเช็คฝั่ง client
                },
                skip: offset,
                take: limit,
            });


            // นับจำนวนทั้งหมดเพื่อใช้สำหรับ frontend
            const totalRecords = await prisma.requisitionLog.count({ where: { requested_groupid } });
            const totalPages = Math.ceil(totalRecords / limit);

            return NextResponse.json({ items: groupLogs, totalPages, totalRecords });
        }

        // ดึงข้อมูลตาม status (ถ้ามี) หรือดึงทั้งหมด
        const requisitionLogs = await prisma.requisitionLog.findMany({
            where: status ? { status } : undefined,
            select: {
                requested_groupid: true,
                user: { select: { title: true, firstName: true, lastName: true } },
                status: true,
            },
            distinct: ["requested_groupid"], // ดึงเฉพาะกลุ่มที่ไม่ซ้ำ
            skip: offset, // ใช้ offset สำหรับ pagination
            take: limit, // จำกัดจำนวนข้อมูล
        });

        // นับจำนวนทั้งหมดเพื่อใช้กับ frontend
        const totalRecords = await prisma.requisitionLog.count({
            where: status ? { status } : undefined,
        });
        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({
            items: requisitionLogs,
            totalPages,
            totalRecords,
            totalItems: totalRecords,
        });

    } catch (error) {
        console.error("Error fetching requisition logs:", error instanceof Error ? error.stack : error);
        return NextResponse.json(
            {
                error: "Failed to fetch requisition logs",
                detail: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }


}


// อัปเดตสถานะ requisition log
export async function PUT(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin', 'user']);
    if (access !== true) return access;

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
        console.error("Internal Server Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
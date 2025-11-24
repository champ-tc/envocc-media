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


// ดึงข้อมูล requisition log (นับแบบกลุ่ม)
export async function GET(req: NextRequest) {
    const access = await protectApiRoute(req, ["admin", "user"]);
    if (access !== true) return access;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as
        | "Pending"
        | "Approved"
        | "NotApproved"
        | null;
    const requested_groupid = searchParams.get("groupid");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const whereClause = status ? { status } : undefined;

    // === กรณีเปิด modal: เอามาทั้งกลุ่ม ให้สกอลในโมดัล ===
    if (requested_groupid) {
        const groupLogs = await prisma.requisitionLog.findMany({
            where: { requested_groupid },
            include: {
                // ✅ เพิ่ม department ให้แสดงใน modal ได้
                user: {
                    select: {
                        title: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
                requisition: { select: { requisition_name: true } },
                reason: true,
            },
            orderBy: { id: "asc" },
        });

        return NextResponse.json({
            items: groupLogs,
            totalPages: 1,
            totalRecords: groupLogs.length,
            totalItems: groupLogs.length,
        });
    }

    // === 1) นับ "จำนวนกลุ่ม" ===
    const allGroups = await prisma.requisitionLog.groupBy({
        by: ["requested_groupid"],
        where: whereClause,
        _min: { requisition_date: true },
    });

    // เรียงจากใหม่ -> เก่า
    allGroups.sort((a, b) => {
        const ad = a._min.requisition_date
            ? new Date(a._min.requisition_date).getTime()
            : 0;
        const bd = b._min.requisition_date
            ? new Date(b._min.requisition_date).getTime()
            : 0;
        return bd - ad;
    });

    const totalGroups = allGroups.length;
    const totalPages = Math.ceil(totalGroups / limit) || 1;
    const pageGroupIds = allGroups.slice(offset, offset + limit).map((g) => g.requested_groupid);

    // === 2) ดึงตัวแทนของแต่ละ group เพื่อโชว์ในตาราง ===
    const pageItemsRaw = await prisma.requisitionLog.findMany({
        where: { requested_groupid: { in: pageGroupIds }, ...(whereClause || {}) },
        select: {
            requested_groupid: true,
            status: true,
            delivery_address: true,
            // ✅ เพิ่ม department เพื่อให้หน้า UI แสดงหน่วยงานได้
            user: {
                select: {
                    title: true,
                    firstName: true,
                    lastName: true,
                    department: true,
                },
            },
        },
        orderBy: [{ requested_groupid: "asc" }, { requisition_date: "desc" }],
    });

    // จับคู่ตามลำดับ pageGroupIds (กัน null เผื่อกรณีหาไม่เจอ)
    const pageItems = pageGroupIds
        .map((id) => pageItemsRaw.find((r) => r.requested_groupid === id) || null)
        .filter((v): v is NonNullable<typeof v> => Boolean(v));

    return NextResponse.json({
        items: pageItems,
        totalPages,
        totalRecords: totalGroups,
        totalItems: totalGroups,
    });
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
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';
import { getToken } from "next-auth/jwt";

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === 'admin' || token.role === 'user'));
}

// ใช้สำหรับ requisition_summary
export async function POST(req: Request) {

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { userId, orders, deliveryMethod, address } = await req.json();

        // ตรวจสอบ userId
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        
        if (!userExists) {
            return NextResponse.json({ message: "User does not exist" }, { status: 400 });
        }

        // ตรวจสอบ requisitionId ทั้งหมดใน orders
        const requisitionIds = orders.map((order: { requisitionId: number }) => order.requisitionId);
        const existingRequisitions = await prisma.requisition.findMany({
            where: { id: { in: requisitionIds } },
        });

        if (existingRequisitions.length !== requisitionIds.length) {
            return NextResponse.json({ message: "Invalid requisition IDs", requisitionIds }, { status: 400 });
        }

        // สร้าง group ID ใหม่
        const newGroupId = uuidv4();

        // สร้าง requisition logs
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
        }));

        // ใช้ transaction เพื่อสร้าง requisition log และลบ order
        await prisma.$transaction([
            prisma.requisitionLog.createMany({ data: requisitionLogs }),
            prisma.order.deleteMany({
                where: {
                    userId: userId,
                    requisitionId: { in: requisitionIds },
                },
            }),
        ]);

        return NextResponse.json({
            message: "Requisition logs created successfully",
            groupId: newGroupId,
        });

    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
    }
}

// ดึงข้อมูล requisition log
export async function GET(req: Request) {
    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
                },
                skip: offset, // ใช้ offset สำหรับ pagination
                take: limit, // จำกัดจำนวนข้อมูล
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

        return NextResponse.json({ items: requisitionLogs, totalPages, totalRecords });
    } catch (error) {
        console.error("Error fetching requisition logs:", error);
        return NextResponse.json({ error: "Failed to fetch requisition logs" }, { status: 500 });
    }
}


// อัปเดตสถานะ requisition log
export async function PUT(req: Request) {

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
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
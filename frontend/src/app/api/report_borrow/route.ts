import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from 'next-auth/jwt';

async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

export async function GET(req: Request) {

    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        // ดึงข้อมูล log
        const logs = await prisma.borrowLog.findMany({
            include: {
                user: {
                    select: {
                        title: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
                borrow: {
                    select: {
                        borrow_name: true,
                    },
                },
            },
            orderBy: {
                borrow_date: "desc",
            },
            skip: offset,
            take: limit,
        });

        // จำนวนทั้งหมด (ไม่จำกัดหน้า)
        const totalRecords = await prisma.borrowLog.count();
        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({
            items: logs,
            totalRecords,
            totalPages,
        });
    } catch (error: any) {
        console.error("🔥 Error fetching borrow logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch borrow logs" },
            { status: 500 }
        );
    }
}

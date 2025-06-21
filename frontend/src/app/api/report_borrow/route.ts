import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';

export async function GET(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    try {
        // ดึงข้อมูลทั้งหมด (ไม่ paginate)
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
        });

        // จำนวนทั้งหมด
        const totalRecords = logs.length;

        return NextResponse.json({
            items: logs,
            totalRecords,
        });

    } catch (error) {
        console.error("🔥 Error fetching borrow logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch borrow logs" },
            { status: 500 }
        );
    }
}

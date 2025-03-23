import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// ตรวจสอบว่าเป็น admin หรือไม่
async function checkAdminSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && token.role === "admin");
}

export async function GET(req: Request) {
    // ตรวจสอบสิทธิ์
    if (!(await checkAdminSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

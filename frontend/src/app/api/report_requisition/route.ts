import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from 'next-auth/jwt';

async function checkAdminSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === "admin");
}

export async function GET(request: NextRequest) {

    if (!(await checkAdminSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const logs = await prisma.requisitionLog.findMany({
            include: {
                user: {
                    select: {
                        title: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
                requisition: {
                    select: {
                        requisition_name: true,
                    },
                },
            },
            orderBy: {
                requisition_date: "desc",
            },
        });


        return NextResponse.json({
            items: logs,
            totalRecords: logs.length,
            totalPages: 1,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("🔥 Prisma error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.error("🔥 Unknown error:", error);
        return NextResponse.json({ error: "Unknown server error" }, { status: 500 });
    }
}

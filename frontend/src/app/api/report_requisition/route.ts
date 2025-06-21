import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';



export async function GET(request: NextRequest) {

    const access = await protectApiRoute(request, ['admin']);
    if (access !== true) return access;

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

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

async function checkUserSession(request: NextRequest): Promise<boolean> {
    const token = await getToken({ req: request });
    return !!(token && token.role === "user");
}


export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // Unwrap params

    if (!(await checkUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const userId = id;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        console.log("API Request Parameters:", { userId, status });

        // ดึงข้อมูล borrow_logs
        const borrowLogsRaw = await prisma.borrowLog.findMany({
            where: {
                user_id: parseInt(userId),
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: "desc" },
            include: {
                borrow: { select: { borrow_name: true } },
                user: { select: { title: true, firstName: true, lastName: true } },
            },
        });

        const borrowLogsGrouped = borrowLogsRaw.reduce(
            (
                groups: Record<string, { borrow_groupid: string; logs: typeof borrowLogsRaw }>,
                log
            ) => {
                const group = groups[log.borrow_groupid] || {
                    borrow_groupid: log.borrow_groupid,
                    logs: [],
                };
                group.logs.push(log);
                groups[log.borrow_groupid] = group;
                return groups;
            },
            {}
        );

        // ดึงข้อมูล requisition_logs
        const requisitionLogsRaw = await prisma.requisitionLog.findMany({
            where: {
                user_id: parseInt(userId),
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: "desc" },
            include: {
                requisition: { select: { requisition_name: true } },
                user: { select: { title: true, firstName: true, lastName: true } },
            },
        });

        const requisitionLogsGrouped = requisitionLogsRaw.reduce(
            (
                groups: Record<string, { requested_groupid: string; logs: typeof requisitionLogsRaw }>,
                log
            ) => {
                const group = groups[log.requested_groupid] || {
                    requested_groupid: log.requested_groupid,
                    logs: [],
                };
                group.logs.push(log);
                groups[log.requested_groupid] = group;
                return groups;
            },
            {}
        );

        return NextResponse.json({
            borrowLogs: Object.values(borrowLogsGrouped)
                .sort((a, b) => new Date(b.logs[0].createdAt).getTime() - new Date(a.logs[0].createdAt).getTime())
                .slice(0, 10)
                .map((group) => ({
                    ...group,
                    createdAt: group.logs[0].createdAt, // ✅ เพิ่ม createdAt ของกลุ่ม
                })),

            requisitionLogs: Object.values(requisitionLogsGrouped)
                .sort((a, b) => new Date(b.logs[0].createdAt).getTime() - new Date(a.logs[0].createdAt).getTime())
                .slice(0, 10)
                .map((group) => ({
                    ...group,
                    createdAt: group.logs[0].createdAt, // ✅ เพิ่ม createdAt ของกลุ่ม
                })),
        });


    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

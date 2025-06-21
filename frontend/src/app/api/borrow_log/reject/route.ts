import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from '@/lib/protectApi';


export async function PUT(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    try {
        const { groupId } = await req.json();

        if (!groupId) {
            return NextResponse.json({ message: "Group ID is required" }, { status: 400 });
        }

        // อัปเดตสถานะของ borrow log เป็น 'NotApproved'
        await prisma.borrowLog.updateMany({
            where: { borrow_groupid: groupId },
            data: { status: "NotApproved" },
        });

        return NextResponse.json({ message: "Borrow logs marked as not approved" });
    } catch (error) {
        console.error("Error marking borrow logs as not approved:", error);
        return NextResponse.json({ error: "Failed to update borrow logs" }, { status: 500 });
    }
}

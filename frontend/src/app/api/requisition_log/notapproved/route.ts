import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { protectApiRoute } from '@/lib/protectApi';



export async function POST(req: NextRequest) {

    const access = await protectApiRoute(req, ['admin']);
    if (access !== true) return access;

    try {
        // ตรวจสอบสิทธิ์ admin
        const token = await getToken({ req });
        if (!token || token.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const adminId = token.sub; // ดึง admin ID จาก token
        if (!adminId) {
            return NextResponse.json({ message: "Admin ID missing in token" }, { status: 400 });
        }

        // ดึงข้อมูลจาก body
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ message: "Missing ID in request body" }, { status: 400 });
        }

        // อัปเดตสถานะเป็น NotApproved
        const updatedLogs = await prisma.requisitionLog.updateMany({
            where: { requested_groupid: id },
            data: { status: "NotApproved", approved_by_admin_id: parseInt(adminId, 10) },
        });

        return NextResponse.json({ success: true, updatedLogs }, { status: 200 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error in POST /api/requisition_log/notapproved:", error.message);
            return NextResponse.json(
                { error: "Internal Server Error", details: error.message },
                { status: 500 }
            );
        } else {
            console.error("Unknown error in POST /api/requisition_log/notapproved:", error);
            return NextResponse.json(
                { error: "Internal Server Error" },
                { status: 500 }
            );
        }
    }
}

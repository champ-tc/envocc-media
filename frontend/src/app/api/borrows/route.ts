import { NextResponse, type NextRequest } from "next/server";
import { prisma } from '@/lib/prisma';
import { protectApiRoute } from '@/lib/protectApi';

// Handler สำหรับ GET requests
export async function GET(request: NextRequest) {
    const access = await protectApiRoute(request, ['admin', 'user']);
    if (access !== true) return access;

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        const totalRecords = await prisma.borrow.count({
            where: {
                is_borro_restricted: false,
                status: 1,
            },
        });

        const borrows = await prisma.borrow.findMany({
            where: {
                is_borro_restricted: false,
                status: 1,
            },
            include: {
                type: true,
            },
            skip: offset,
            take: limit,
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({ items: borrows, totalPages, totalRecords }, { status: 200 });
    } catch (error) {
        console.error("Error fetching borrows:", error);
        return NextResponse.json({ message: "Error fetching borrows" }, { status: 500 });
    }
}

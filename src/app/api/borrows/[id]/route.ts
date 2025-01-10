import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === 'admin' || token.role === 'user'));
}

export async function GET(request: Request, { params }: { params: { id: string } }) {

    if (!(await checkAdminOrUserSession(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        // รอให้ params ถูก resolve ก่อน
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
        }

        const borrow = await prisma.borrow.findUnique({
            where: { id },
            include: {
                type: true,
            },
        });

        if (!borrow) {
            return NextResponse.json({ message: "Borrow not found" }, { status: 404 });
        }

        return NextResponse.json(borrow, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching borrow" }, { status: 500 });
    }
}

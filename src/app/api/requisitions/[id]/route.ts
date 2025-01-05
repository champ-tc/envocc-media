import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from 'next-auth/jwt';

async function checkAdminOrUserSession(request: Request): Promise<boolean> {
    const token = await getToken({ req: request as any });
    return !!(token && (token.role === 'admin' || token.role === 'user'));
}

export async function GET(req: Request, { params }: { params: { id: string } }) {

    if (!(await checkAdminOrUserSession(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const id = parseInt(params.id, 10);
        const requisition = await prisma.requisition.findUnique({
            where: { id },
            include: { type: true },
        });

        if (!requisition) {
            return NextResponse.json({ message: "Requisition not found" }, { status: 404 });
        }

        const remaining = requisition.quantity - (requisition.reserved_quantity || 0);

        return NextResponse.json({
            ...requisition,
            remaining,
            requisition_images: `/requisitions/${requisition.requisition_images}`,
        });
    } catch (error) {
        console.error("Error fetching requisition:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
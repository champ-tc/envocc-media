import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
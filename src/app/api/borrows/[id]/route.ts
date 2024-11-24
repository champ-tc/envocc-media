import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id, 10);
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

        console.log("Borrow detail:", borrow); // Debug ข้อมูล

        return NextResponse.json(borrow, { status: 200 });
    } catch (error) {
        console.error("Error fetching borrow:", error);
        return NextResponse.json({ message: "Error fetching borrow" }, { status: 500 });
    }
}

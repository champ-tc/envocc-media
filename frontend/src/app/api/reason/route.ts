import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ใช้ `GET` แทน `default export`
export async function GET() {
    try {
        const reasons = await prisma.reason.findMany();
        return NextResponse.json(reasons, { status: 200 });
    } catch (error) {
        console.error("Error fetching reasons:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
